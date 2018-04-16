import {apply, concat, every, filter, first, identity, keep, keepIndexed, map, mapcat, mapIndexed, range, some} from 'folivora';
import {fnv1a, isEqualArray} from './utility';

// 方角。盤面は、番兵を配置した縦8×横7を、一次元に変換した形です。
export const Direction = (() => {
  const result = {
    northWest: -8,
    north:     -7,
    northEast: -6,
    west:      -1,
    east:       1,
    southWest:  6,
    south:      7,
    southEast:  8
  };

  result.directions = [result.northWest, result.north, result.northEast, result.west, result.east, result.southWest, result.south, result.southEast];

  return result;
})();

// プレイヤー。
export const Player = {
  black: 1,
  white: 2
};

// 次のプレイヤーを取得します。
export const getNextPlayer = (player) => player == Player.black ? Player.white : Player.black;

// 駒の種別。
export const PieceType = {
  chick:      1,
  chicken:    2,
  cat:        3,
  powerUpCat: 4,
  dog:        5,
  lion:       6
};

// 駒。
export const Piece = (() => {
  const result = {
    blackChick:      { owner: Player.black, type: PieceType.chick      },
    blackChicken:    { owner: Player.black, type: PieceType.chicken    },
    blackCat:        { owner: Player.black, type: PieceType.cat        },
    blackPowerUpCat: { owner: Player.black, type: PieceType.powerUpCat },
    blackDog:        { owner: Player.black, type: PieceType.dog        },
    blackLion:       { owner: Player.black, type: PieceType.lion       },
    whiteChick:      { owner: Player.white, type: PieceType.chick      },
    whiteChicken:    { owner: Player.white, type: PieceType.chicken    },
    whiteCat:        { owner: Player.white, type: PieceType.cat        },
    whitePowerUpCat: { owner: Player.white, type: PieceType.powerUpCat },
    whiteDog:        { owner: Player.white, type: PieceType.dog        },
    whiteLion:       { owner: Player.white, type: PieceType.lion       }
  };

  result.pieces = [
    result.blackChick, result.blackChicken, result.blackCat, result.blackPowerUpCat, result.blackDog, result.blackLion,
    result.whiteChick, result.whiteChicken, result.whiteCat, result.whitePowerUpCat, result.whiteDog, result.whiteLion
  ];

  return result;
})();

// 駒が移動できる方角を取得します。
export const getMoveDirections = (() => {
  const rule = new Map([
    [Piece.blackChick, [                     Direction.north                                                                                                                ]],
    [Piece.blackCat,   [Direction.northWest, Direction.north, Direction.northEast,                                 Direction.southWest,                  Direction.southEast]],
    [Piece.blackDog,   [Direction.northWest, Direction.north, Direction.northEast, Direction.west, Direction.east,                      Direction.south                     ]],
    [Piece.blackLion,  [Direction.northWest, Direction.north, Direction.northEast, Direction.west, Direction.east, Direction.southWest, Direction.south, Direction.southEast]]
  ]);

  for (const piece of [Piece.blackChicken, Piece.blackPowerUpCat]) {
    rule.set(piece, rule.get(Piece.blackDog));  // 「にわとり」と「パワーアップねこ」は「いぬ」と同じ動き。
  }

  for (const [whitePiece, blackPiece] of map(Array.of, filter(piece => piece.owner === Player.white, Piece.pieces), filter(piece => piece.owner === Player.black, Piece.pieces))) {
    rule.set(whitePiece, Array.from(map((direction) => -direction, rule.get(blackPiece))));  // 白駒の動きは黒駒の動きの反転。
  }

  return (piece) => rule.get(piece);
})();

// 駒が成った結果を取得します。
export const getPromotedPiece = (() => {
  const rule = new Map([
    [Piece.blackChick, Piece.blackChicken   ],
    [Piece.blackCat,   Piece.blackPowerUpCat],
    [Piece.whiteChick, Piece.whiteChicken   ],
    [Piece.whiteCat,   Piece.whitePowerUpCat]
  ]);

  return (piece) => rule.get(piece) || piece;
})();

// 駒を取った結果を取得します。
export const getCapturedPiece = (() => {
  const rule = new Map([
    [Piece.blackChick,      Piece.whiteChick],
    [Piece.blackChicken,    Piece.whiteChick],
    [Piece.blackCat,        Piece.whiteCat  ],
    [Piece.blackPowerUpCat, Piece.whiteCat  ],
    [Piece.blackDog,        Piece.whiteDog  ],
    [Piece.blackLion,       Piece.whiteLion ],
    [Piece.whiteChick,      Piece.blackChick],
    [Piece.whiteChicken,    Piece.blackChick],
    [Piece.whiteCat,        Piece.blackCat  ],
    [Piece.whitePowerUpCat, Piece.blackCat  ],
    [Piece.whiteDog,        Piece.blackDog  ],
    [Piece.whiteLion,       Piece.blackLion ]
  ]);

  return (piece) => rule.get(piece);
})();

// 手。
export class Move {
  constructor(fromBoard, fromCaptured, to) {
    this.fromBoard = fromBoard;
    this.fromCaptured = fromCaptured;
    this.to = to;
  }

  equals(other) {
    return this.fromBoard === other.fromBoard && this.fromCaptured === other.fromCaptured && this.to === other.to;
  }
}

// 空きと壁のマス。管理が楽になるように、Pieceとインターフェースを揃えています。
export const vacant = { owner:  0, type:  0 };
export const wall   = { owner: -1, type: -1 };

// 局面。
export class State {
  constructor(...args) {
    const [player, board, capturedPieces, enemyCapturedPieces, winner] = (() => {
      switch (args.length) {
      case 0:
        return [
          Player.black,
          [
            wall, wall,           wall,             wall,             wall,             wall,           wall,
            wall, Piece.whiteCat, Piece.whiteDog,   Piece.whiteLion,  Piece.whiteDog,   Piece.whiteCat, wall,
            wall, vacant,         vacant,           vacant,           vacant,           vacant,         wall,
            wall, vacant,         Piece.whiteChick, Piece.whiteChick, Piece.whiteChick, vacant,         wall,
            wall, vacant,         Piece.blackChick, Piece.blackChick, Piece.blackChick, vacant,         wall,
            wall, vacant,         vacant,           vacant,           vacant,           vacant,         wall,
            wall, Piece.blackCat, Piece.blackDog,   Piece.blackLion,  Piece.blackDog,   Piece.blackCat, wall,
            wall, wall,           wall,             wall,             wall,             wall,           wall
          ],
          [],
          [],
          null,
        ];

      default:
        return args;
      }
    })();

    this.player              = player;
    this.board               = board;
    this.capturedPieces      = capturedPieces;
    this.enemyCapturedPieces = enemyCapturedPieces,
    this.winner              = winner;
  }

  // 「打ちひよこ詰め」か確認します。「ごろごろどうぶつしょうぎ」には遠くへ移動できる駒がないので、こんな感じで判定できるはず……。
  isDropChickMate(chickPosition, chickPiece) {
    const nextPosition = chickPosition + getMoveDirections(chickPiece)[0];
    const nextPiece = this.board[nextPosition];

    // 頭が敵の玉でなければ、「打ちひよこ詰め」ではありません。
    if (nextPiece.type !== PieceType.lion && nextPiece.owner !== getNextPlayer(this.player)) {
      return false;
    }

    // 敵のライオンに安全な移動先があるなら、「打ちひよこ詰め」ではないはず。
    if (tCall(map(direction => nextPosition + direction, getMoveDirections(nextPiece)),
              some(position => {
                const piece = this.board[position];

                return (piece === vacant || piece.owner === this.player) && !tCall(map(direction => position + direction, Direction.directions),
                                                                                   some(aroundPosition => {
                                                                                     const aroundPiece = this.board[aroundPosition];

                                                                                     return aroundPiece.owner === this.player && some(direction => aroundPosition + direction === position, getMoveDirections(aroundPiece));
                                                                                   }));
              })))
    {
      return false;
    }

    // ひよこの周囲にある、敵のライオン以外の駒でひよこを取れるなら、「打ちひよこ詰め」ではないはず（王手を敵が無視して、さらに、玉を取らずに打ち歩する場合は別だけど、無視で）。
    if (tCall(map(direction => chickPosition + direction, Direction.directions),
              some(position => {
                const piece = this.board[position];

                return piece.owner === getNextPlayer(this.player) && piece.type !== PieceType.lion && some(direction => position + direction === chickPosition, getMoveDirections(piece));
              })))
    {
      return false;
    }

    // そうでなければ、「打ちひよこ詰め」のはず。
    return true;
  }

  // 合法手を取得します。
  getLegalMoves() {
    return concat(
      // 駒を移動する手。
      tCall(this.board,
            keepIndexed((from, piece) => {
              if (piece.owner !== this.player) {
                return null;
              }

              return tCall(getMoveDirections(piece),
                           map(direction => from + direction),
                           keep(to => this.board[to] === vacant || this.board[to].owner === getNextPlayer(this.player) ? new Move(from, null, to) : null));
            }),
            apply(concat)()),

      // 駒を打つ手。
      tCall(this.capturedPieces,
            keepIndexed((from, piece) => tCall(this.board,
                                               keepIndexed((to, toPiece) => {
                                                 if (toPiece !== vacant) {
                                                   return null;
                                                 }

                                                 if (piece.type == PieceType.chick) {
                                                   // 「二ひよこ」は禁手。
                                                   if (some(position => this.board[position].owner === this.player && this.board[position].type === PieceType.chick, range(to % 7, 8 * 7, 7))) {
                                                     return null;
                                                   }

                                                   // 「駒の利きが盤上に存在しないようにする手」は禁手。
                                                   if (this.board[to + getMoveDirections(piece)[0]] === wall) {
                                                     return null;
                                                   }

                                                   // 「打ちひよこ詰め」は禁手。
                                                   if (this.isDropChickMate(to, piece)) {
                                                     return null;
                                                   }
                                                 }

                                                 return new Move(null, from, to);
                                               }))),
            apply(concat)()));

    // 「ごろごろどうぶつしょうぎ」では、「玉を取られる着手」と「連続王手の千日手」は禁手ではないみたい。
  }

  // 敵陣かどうかを判断します。
  isEnemySide(position) {
    const y = Math.floor(position / 7);

    return this.player === Player.black ? y <= 2 : y >= 5;
  }

  // 手を実行して、その結果の状態を返します。getLegalMovesの中の手で呼び出されるはずなので、エラー・チェックはしません。
  doMove(move) {
    // 手の実行で変更になる状態をコピーします。
    const nextPlayer         = getNextPlayer(this.player);
    const nextBoard          = Array.from(this.board);
    const nextCapturedPieces = Array.from(this.capturedPieces);

    // 手を実行します。
    if (move.fromBoard) {  // 盤面の駒を動かす手の場合。
      if (this.board[move.to] !== vacant) {
        nextCapturedPieces.push(getCapturedPiece(this.board[move.to]));
        nextCapturedPieces.sort((piece1, piece2) => piece1.type - piece2.type);
      }

      nextBoard[move.to] = this.isEnemySide(move.to) ? getPromotedPiece(nextBoard[move.fromBoard]) : nextBoard[move.fromBoard];
      nextBoard[move.fromBoard] = vacant;
    } else {               // 手駒を打つ手の場合。
      nextBoard[move.to] = nextCapturedPieces[move.fromCaptured];
      nextCapturedPieces.splice(move.fromCaptured, 1);
    }

    // 新しい状態を生成して返します。
    return new State(
      nextPlayer,
      nextBoard,
      this.enemyCapturedPieces,
      nextCapturedPieces,
      !some(piece => piece.type === PieceType.lion && piece.owner === nextPlayer, nextBoard) ? this.player : null);  // 「ころごろどうぶつしょうぎ」はライオンを取ったら勝ち（今まで知らなかったけど、将棋では違います。「玉を取られる着手」が禁手）。
  }

  equals(other) {
    if (this.player !== other.player || !isEqualArray(this.board, other.board) || !isEqualArray(this.capturedPieces, other.capturedPieces) || !isEqualArray(this.enemyCapturedPieces, other.enemyCapturedPieces)) {
      return false;
    }

    return true;
  }

  hashcode() {
    const piecesToInts = (pieces) => mapcat(piece => [piece.owner, piece.type], pieces);

    return fnv1a(concat([this.player], piecesToInts(this.board), piecesToInts(this.capturedPieces), piecesToInts(this.enemyCapturedPieces)));
  }
}

State.prototype.toString = (function() {
  const rule = new Map([
    [Piece.blackChick,      '▲ひ'],
    [Piece.blackChicken,    '▲に'],
    [Piece.blackCat,        '▲ね'],
    [Piece.blackPowerUpCat, '▲パ'],
    [Piece.blackDog,        '▲い'],
    [Piece.blackLion,       '▲ラ'],
    [Piece.whiteChick,      '▽ひ'],
    [Piece.whiteChicken,    '▽に'],
    [Piece.whiteCat,        '▽ね'],
    [Piece.whitePowerUpCat, '▽パ'],
    [Piece.whiteDog,        '▽い'],
    [Piece.whiteLion,       '▽ラ']
  ]);

  const piecesToString = (pieces) => Array.from(map(piece => rule.get(piece) || '    ', pieces)).join(' ');

  return function() {
    return [
      `手番${ this.player == Player.black ? '▲' : '▽' }`,
      '--',
      piecesToString(this.player == Player.white ? this.capturedPieces : this.enemyCapturedPieces),
      '--',
      ...map(y => piecesToString(map(x => this.board[y * 7 + x], range(1, 6))), range(1, 7)),
      '--',
      piecesToString(this.player == Player.black ? this.capturedPieces : this.enemyCapturedPieces)
    ].join('\n');
  };
})();
