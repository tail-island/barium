import 'babel-polyfill';

import window_load_createjs from 'window_load_createjs';
import {range} from 'folivora';
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

    console.log(result.image.width);
    console.log(result.image.height);

    result.piece    = piece;
    result.regY     = result.image.height / 2;
    result.regX     = result.image.width  / 2;
    result.rotation = rotationRule.get(piece.owner);

    result.moveToBoard = (y, x) => {
      result.y =  40 + y * 80;
      result.x = 160 + x * 80;

      result.scaleY = 60 / result.image.height;
      result.scaleX = 60 / result.image.width;
    };

    result.animateToBoard = (y, x) => {
      createjs.Tween.get(result).
        to({y:       40 + y * 80,
            x:      160 + x * 80,
            scaleX: 60 / result.image.height,
            scaleY: 60 / result.image.width},
           1000,
           createjs.Ease.cubicInOut);
    };

    result.moveToCaptured = (player, index) => {
      if (player == Player.black) {
        result.y = 460 - (index % 7) * 40;
        result.x = 620 - Math.floor(index / 7) * 40;
      } else {
        result.y =  20 + (index % 7) * 40;
        result.x =  20 + Math.floor(index / 7) * 40;
      }

      result.scaleY = 30 / result.image.height;
      result.scaleX = 30 / result.image.width;

      result.rotation = rotationRule.get(player);
    };

    result.animateToCaptured = (player, index) => {
      const [y, x] = (() => {
        if (player == Player.black) {
          return [460 - (index % 7) * 40,
                  620 - Math.floor(index / 7) * 40];
        } else {
          return [ 20 + (index % 7) * 40,
                   20 + Math.floor(index / 7) * 40];
        }
      })();

      createjs.Tween.get(result).
        to({y:        y,
            x:        x,
            scaleY:   30 / result.image.height,
            scaleX:   30 / result.image.width,
            rotation: rotationRule.get(player)},
           1000,
           createjs.Ease.cubicInOut);
    };

    return result;
  };
})();

const fromPosition = (position) => {
  return [Math.floor(position / 7) - 1, (position % 7) - 1];
};

const toPosition = (y, x) => {
  return (y + 1) * 7 + (x + 1);
};

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
          stage.addChild(pieceShape);

          pieceShape.moveToBoard(y, x);
        }
      }
    }
  }

  async doMove(move) {
    const isEnemySide = (y) => this.player === Player.black ? y <= 1 : y >= 4;

    const moveFromBoard = (fromY, fromX, toY, toX) => {
      if (this.board[toY][toX]) {
        const pieceShape = this.board[toY][toX];
        stage.removeChild(pieceShape);

        const capturedPieceShape = createPieceShape(getCapturedPiece(pieceShape.piece));
        capturedPieceShape.moveToBoard(toY, toX);
        stage.addChild(capturedPieceShape);

        capturedPieceShape.animateToCaptured(this.player, this.capturedPieces.get(this.player).length);

        this.capturedPieces.get(this.player).push(capturedPieceShape);
      }

      const pieceShape = (() => {
        const result = this.board[fromY][fromX];

        if (isEnemySide(toY) && result.piece !== getPromotedPiece(result.piece)) {
          stage.removeChild(result);

          const promotedShape = createPieceShape(getPromotedPiece(result.piece));
          promotedShape.moveToBoard(fromY, fromX);
          stage.addChild(promotedShape);

          return promotedShape;
        }

        return result;
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

    if (!move) {
      return;
    }

    if (move.fromBoard && move.fromBoard >= 0) {
      moveFromBoard(...fromPosition(move.fromBoard), ...fromPosition(move.to));
    } else {
      moveFromCaptured(move.fromCaptured, ...fromPosition(move.to));
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    this.player = getNextPlayer(this.player);
  }
}

createjs.Ticker.addEventListener('tick', () => {
  stage.update();
});
