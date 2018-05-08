import window_load_createjs from 'window_load_createjs';
import {apply, concat, filter, map, range, some} from 'lajure';
import {Piece, PieceType, Player, getCapturedPiece, getNextPlayer, getPromotedPiece} from './game';

const stage = (() => {
  const result = new createjs.Stage(document.getElementById('canvas'));

  result.addChild((() => {
    const result = new createjs.Shape();

    result.graphics.beginStroke('#888888');

    for (const y of range(7)) {
      result.graphics.moveTo(120, y * 80);
      result.graphics.lineTo(520, y * 80);
    }

    for (const x of range(6)) {
      result.graphics.moveTo(x * 80 + 120,   0);
      result.graphics.lineTo(x * 80 + 120, 480);
    }

    result.graphics.endStroke();

    return result;
  })());

  result.y = 0.5;
  result.x = 0.5;

  return result;
})();

const createPieceShape = (() => {
  const bitmapRule = new Map([
    [PieceType.chick,      new createjs.Bitmap(require('../image/chick.png'))],
    [PieceType.chicken,    new createjs.Bitmap(require('../image/chicken.png'))],
    [PieceType.cat,        new createjs.Bitmap(require('../image/cat.png'))],
    [PieceType.powerUpCat, new createjs.Bitmap(require('../image/power-up-cat.png'))],
    [PieceType.dog,        new createjs.Bitmap(require('../image/dog.png'))],
    [PieceType.lion,       new createjs.Bitmap(require('../image/lion.png'))]
  ]);

  const rotationRule = new Map([
    [Player.black,   0],
    [Player.white, 180]
  ]);

  return (piece) => {
    const result = bitmapRule.get(piece.type).clone();

    result.piece    = piece;
    result.regY     = result.image.height / 2;
    result.regX     = result.image.width  / 2;
    result.rotation = rotationRule.get(piece.owner);

    const toBoardProps = (y, x) => {
      return {y: 40 + y * 80, x: 160 + x * 80, scaleX: 60 / result.image.height, scaleY: 60 / result.image.width };
    };

    result.moveToBoard = (y, x) => result.set(toBoardProps(y, x));
    result.animateToBoard = (y, x) => createjs.Tween.get(result).to(toBoardProps(y, x), 1000, createjs.Ease.cubicInOut);

    const toCapturedProps = (player, index) => {
      const [y, x] = (() => {
        switch (player) {
        case Player.black: return [460 - (index % 7) * 40, 620 - Math.floor(index / 7) * 40];
        case Player.white: return [ 20 + (index % 7) * 40,  20 + Math.floor(index / 7) * 40];
        default:           throw('Illegal arguments.');
        }
      })();

      return {y: y, x: x, scaleY: 30 / result.image.height, scaleX: 30 / result.image.width, rotation: rotationRule.get(player)};
    };

    result.moveToCaptured = (player, index) => result.set(toCapturedProps(player, index));
    result.animateToCaptured = (player, index) => createjs.Tween.get(result).to(toCapturedProps(player, index), 1000, createjs.Ease.cubinInOut);

    return result;
  };
})();

const fromPosition = (position) => [Math.floor(position / 7) - 1, (position % 7) - 1];

export class UI {
  constructor() {
    this.player = Player.black;

    this.board = [
      [createPieceShape(Piece.whiteCat), createPieceShape(Piece.whiteDog),   createPieceShape(Piece.whiteLion),  createPieceShape(Piece.whiteDog),   createPieceShape(Piece.whiteCat)],
      [null,                             null,                               null,                               null,                               null                            ],
      [null,                             createPieceShape(Piece.whiteChick), createPieceShape(Piece.whiteChick), createPieceShape(Piece.whiteChick), null                            ],
      [null,                             createPieceShape(Piece.blackChick), createPieceShape(Piece.blackChick), createPieceShape(Piece.blackChick), null                            ],
      [null,                             null,                               null,                               null,                               null                            ],
      [createPieceShape(Piece.blackCat), createPieceShape(Piece.blackDog),   createPieceShape(Piece.blackLion),  createPieceShape(Piece.blackDog),   createPieceShape(Piece.blackCat)]
    ];

    this.capturedPieces = new Map([
      [Player.black, []],
      [Player.white, []]
    ]);

    for (const y of range(6)) {
      for (const x of range(5)) {
        const pieceShape = this.board[y][x];

        if (pieceShape) {
          pieceShape.moveToBoard(y, x);
          stage.addChild(pieceShape);
        }
      }
    }
  }

  getMove(legalMoves) {
    const getLegalMovesFor = (pieceShape) => tCall(legalMoves,
                                                   filter(move => {
                                                     if (move.fromBoard !== null && move.fromBoard >= 0) {
                                                       const [y, x] = fromPosition(move.fromBoard);

                                                       return this.board[y][x] == pieceShape;
                                                     } else {
                                                       return this.capturedPieces.get(this.player)[move.fromCaptured] == pieceShape;
                                                     }
                                                   }));

    const pieceShapes = Array.from(concat(filter(pieceShape => pieceShape && pieceShape.piece.owner == this.player, apply(concat)(this.board)),
                                          this.capturedPieces.get(this.player)));

    const highlightContainer = new createjs.Container();

    const prepareHighlightContainer = (pieceShape) => {
      highlightContainer.removeAllChildren();

      for (const [y, x] of tCall(getLegalMovesFor(pieceShape), map(move => fromPosition(move.to)))) {
        const shape = new createjs.Shape();

        shape.graphics.beginFill('#8888ff');
        shape.graphics.drawRect(-40, -40, 80, 80);
        shape.graphics.endFill();
        shape.alpha = 0.2;
        shape.y =  40 + y * 80;
        shape.x = 160 + x * 80;

        highlightContainer.addChild(shape);
      }
    };

    return new Promise(resolve => {
      const pressmove = (event) => {
        // 元の位置に戻せるように、座標を退避しておきます。
        if (!event.target.originalY) {
          event.target.originalY = event.target.y;
          event.target.originalX = event.target.x;
        }

        // 移動可能な場所をハイライトさせます。
        if (!stage.contains(highlightContainer)) {
          prepareHighlightContainer(event.target);
          stage.addChild(highlightContainer);
        }

        // 他の駒に隠されないようにするために、一番前に移動させます。
        if (!stage.children[stage.children.length - 1] != event.target) {
          stage.removeChild(event.target);
          stage.addChild(event.target);
        }

        // 移動。
        event.target.y = event.stageY;
        event.target.x = event.stageX;
      };

      const pressup = (event) => {
        // pressmoveを通っていない場合は無視します。
        if (!event.target.originalY) {
          return;
        }

        // 移動可能な場所のハイライトを消します。
        stage.removeChild(highlightContainer);

        // 位置を元に戻します。
        event.target.y = event.target.originalY; delete event.target.originalY;
        event.target.x = event.target.originalX; delete event.target.originalX;

        // 移動可能な位置を選んだか、確認します。
        const move = tCall(getLegalMovesFor(event.target),
                           some((move) => {
                             const [y, x] = fromPosition(move.to);

                             const centerY =  40 + y * 80;
                             const centerX = 160 + x * 80;

                             if (event.stageY < centerY - 40 || event.stageY > centerY + 40 || event.stageX < centerX - 40 || event.stageX > centerX + 40) {
                               return null;
                             }

                             return move;
                           }));

        // 移動可能でない場合は、やり直し。
        if (!move) {
          return;
        }

        // イベントを削除します。
        for (const pieceShape of pieceShapes) {
          pieceShape.removeEventListener('pressmove', pressmove);
          pieceShape.removeEventListener('pressup',   pressup);
        }

        // リゾルブ！
        resolve(move);
      };

      // イベントを登録します。
      for (const pieceShape of pieceShapes) {
        pieceShape.addEventListener('pressmove', pressmove);
        pieceShape.addEventListener('pressup',   pressup);
      }
    });
  }

  doMove(move) {
    const isEnemySide = (y) => this.player === Player.black ? y <= 1 : y >= 4;

    const capture = (y, x) => {
      const capturedPieces = this.capturedPieces.get(this.player);

      const pieceShape = (() => {
        const toPieceShape = this.board[y][x];
        stage.removeChild(toPieceShape);

        const promotedPiece = createPieceShape(getCapturedPiece(toPieceShape.piece));
        promotedPiece.moveToBoard(y, x);
        stage.addChild(promotedPiece);

        return promotedPiece;
      })();

      this.board[y][x] = null;
      capturedPieces.push(pieceShape);
      capturedPieces.sort((pieceShape1, pieceShape2) => pieceShape1.piece.type - pieceShape2.piece.type);

      for (const i of range(capturedPieces.length)) {
        capturedPieces[i].animateToCaptured(this.player, i);
      }
    };

    const moveFromBoard = (fromY, fromX, toY, toX) => {
      if (this.board[toY][toX]) {
        capture(toY, toX);
      }

      const pieceShape = (() => {
        const fromPieceshape = this.board[fromY][fromX];

        if (isEnemySide(toY) && fromPieceshape.piece !== getPromotedPiece(fromPieceshape.piece)) {
          stage.removeChild(fromPieceshape);

          const promotedPieceShape = createPieceShape(getPromotedPiece(fromPieceshape.piece));
          promotedPieceShape.moveToBoard(fromY, fromX);
          stage.addChild(promotedPieceShape);

          return promotedPieceShape;
        }

        return fromPieceshape;
      })();

      pieceShape.animateToBoard(toY, toX);

      this.board[fromY][fromX] = null;
      this.board[toY][toX] = pieceShape;
    };

    const moveFromCaptured = (index, toY, toX) => {
      const capturedPieces = this.capturedPieces.get(this.player);

      const pieceShape = capturedPieces[index];
      pieceShape.animateToBoard(toY, toX);

      for (const i of range(index + 1, capturedPieces.length)) {
        capturedPieces[i].animateToCaptured(this.player, i - 1);
      }

      capturedPieces.splice(index, 1);
      this.board[toY][toX] = pieceShape;
    };

    if (move.fromBoard) {
      moveFromBoard(...fromPosition(move.fromBoard), ...fromPosition(move.to));
    } else {
      moveFromCaptured(move.fromCaptured, ...fromPosition(move.to));
    }

    this.player = getNextPlayer(this.player);

    // アニメーションの終了を待てるように、Promiseを返します。姑息なコードでごめんなさい……。
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  drawMessage(message) {
    const text = new createjs.Text(message, '48px serif', '#0000ff');

    text.textAlign    = 'center';
    text.textBaseline = 'middle';
    text.x            = 320;
    text.y            = 240;

    stage.addChild(text);
  }
}

createjs.Ticker.addEventListener('tick', () => {
  stage.update();
});
