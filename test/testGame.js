import assert from 'assert';
import {some} from 'lajure';
import {Direction, Move, Piece, Player, State, getCapturedPiece, getMoveDirections, getNextPlayer, getPromotedPiece, vacant, wall} from '../src/game';

describe('test Direction', () => {
  it('plus direction to position', () => {
    const position = (x, y) => y * 7 + x;

    assert.equal(position(1, 2) + Direction.northWest, position(0, 1));
    assert.equal(position(1, 2) + Direction.north,     position(1, 1));
    assert.equal(position(1, 2) + Direction.northEast, position(2, 1));
    assert.equal(position(1, 2) + Direction.west,      position(0, 2));
    assert.equal(position(1, 2) + Direction.east,      position(2, 2));
    assert.equal(position(1, 2) + Direction.southWest, position(0, 3));
    assert.equal(position(1, 2) + Direction.south,     position(1, 3));
    assert.equal(position(1, 2) + Direction.southEast, position(2, 3));
  });

  it('directions', () => {
    assert.deepEqual(Direction.directions,
                     [Direction.northWest, Direction.north, Direction.northEast,
                      Direction.west,                       Direction.east,
                      Direction.southWest, Direction.south, Direction.southEast]);
  });
});

describe('test Player', () => {
  it('next player', () => {
    assert.equal(getNextPlayer(Player.black), Player.white);
    assert.equal(getNextPlayer(Player.white), Player.black);

    assert.notEqual(Player.black, Player.white);
  });
});

describe('test Piece', () => {
  it('move directions', () => {
    assert.deepEqual(getMoveDirections(Piece.blackChick),      [                     Direction.north                                                                                                                ]);
    assert.deepEqual(getMoveDirections(Piece.blackChicken),    [Direction.northWest, Direction.north, Direction.northEast, Direction.west, Direction.east,                      Direction.south                     ]);
    assert.deepEqual(getMoveDirections(Piece.blackCat),        [Direction.northWest, Direction.north, Direction.northEast,                                 Direction.southWest,                  Direction.southEast]);
    assert.deepEqual(getMoveDirections(Piece.blackPowerUpCat), [Direction.northWest, Direction.north, Direction.northEast, Direction.west, Direction.east,                      Direction.south                     ]);
    assert.deepEqual(getMoveDirections(Piece.blackDog),        [Direction.northWest, Direction.north, Direction.northEast, Direction.west, Direction.east,                      Direction.south                     ]);
    assert.deepEqual(getMoveDirections(Piece.blackLion),       [Direction.northWest, Direction.north, Direction.northEast, Direction.west, Direction.east, Direction.southWest, Direction.south, Direction.southEast]);

    assert.deepEqual(getMoveDirections(Piece.whiteChick),      [                     Direction.south                                                                                                                ]);
    assert.deepEqual(getMoveDirections(Piece.whiteChicken),    [Direction.southEast, Direction.south, Direction.southWest, Direction.east, Direction.west,                      Direction.north                     ]);
    assert.deepEqual(getMoveDirections(Piece.whiteCat),        [Direction.southEast, Direction.south, Direction.southWest,                                 Direction.northEast,                  Direction.northWest]);
    assert.deepEqual(getMoveDirections(Piece.whitePowerUpCat), [Direction.southEast, Direction.south, Direction.southWest, Direction.east, Direction.west,                      Direction.north                     ]);
    assert.deepEqual(getMoveDirections(Piece.whiteDog),        [Direction.southEast, Direction.south, Direction.southWest, Direction.east, Direction.west,                      Direction.north                     ]);
    assert.deepEqual(getMoveDirections(Piece.whiteLion),       [Direction.southEast, Direction.south, Direction.southWest, Direction.east, Direction.west, Direction.northEast, Direction.north, Direction.northWest]);
  });

  it('promotion', () => {
    assert.equal(getPromotedPiece(Piece.blackChick),      Piece.blackChicken);
    assert.equal(getPromotedPiece(Piece.blackChicken),    Piece.blackChicken);
    assert.equal(getPromotedPiece(Piece.blackCat),        Piece.blackPowerUpCat);
    assert.equal(getPromotedPiece(Piece.blackPowerUpCat), Piece.blackPowerUpCat);
    assert.equal(getPromotedPiece(Piece.blackDog),        Piece.blackDog);
    assert.equal(getPromotedPiece(Piece.blackLion),       Piece.blackLion);

    assert.equal(getPromotedPiece(Piece.whiteChick),      Piece.whiteChicken);
    assert.equal(getPromotedPiece(Piece.whiteChicken),    Piece.whiteChicken);
    assert.equal(getPromotedPiece(Piece.whiteCat),        Piece.whitePowerUpCat);
    assert.equal(getPromotedPiece(Piece.whitePowerUpCat), Piece.whitePowerUpCat);
    assert.equal(getPromotedPiece(Piece.whiteDog),        Piece.whiteDog);
    assert.equal(getPromotedPiece(Piece.whiteLion),       Piece.whiteLion);
  });

  it('capturing', () => {
    assert.equal(getCapturedPiece(Piece.blackChick),      Piece.whiteChick);
    assert.equal(getCapturedPiece(Piece.blackChicken),    Piece.whiteChick);
    assert.equal(getCapturedPiece(Piece.blackCat),        Piece.whiteCat);
    assert.equal(getCapturedPiece(Piece.blackPowerUpCat), Piece.whiteCat);
    assert.equal(getCapturedPiece(Piece.blackDog),        Piece.whiteDog);
    assert.equal(getCapturedPiece(Piece.blackLion),       Piece.whiteLion);

    assert.equal(getCapturedPiece(Piece.whiteChick),      Piece.blackChick);
    assert.equal(getCapturedPiece(Piece.whiteChicken),    Piece.blackChick);
    assert.equal(getCapturedPiece(Piece.whiteCat),        Piece.blackCat);
    assert.equal(getCapturedPiece(Piece.whitePowerUpCat), Piece.blackCat);
    assert.equal(getCapturedPiece(Piece.whiteDog),        Piece.blackDog);
    assert.equal(getCapturedPiece(Piece.whiteLion),       Piece.blackLion);
  });
});

describe('test State', () => {
  it('drop chick mate', () => {
    assert.ok(!some(move => move.equals(new Move(null, 0, 15)),
                    new State(
                      Player.black,
                      [
                        wall, wall,            wall,             wall,   wall,   wall,   wall,
                        wall, Piece.whiteLion, Piece.whiteChick, vacant, vacant, vacant, wall,
                        wall, vacant,          Piece.whiteChick, vacant, vacant, vacant, wall,
                        wall, vacant,          Piece.blackDog,   vacant, vacant, vacant, wall,
                        wall, vacant,          vacant,           vacant, vacant, vacant, wall,
                        wall, vacant,          vacant,           vacant, vacant, vacant, wall,
                        wall, Piece.blackLion, vacant,           vacant, vacant, vacant, wall,
                        wall, wall,            wall,             wall,   wall,   wall,   wall
                      ],
                      [Piece.blackChick],
                      [],
                      null
                    ).getLegalMoves()));

    assert.ok(some(move => move.equals(new Move(null, 0, 15)),
                   new State(
                     Player.black,
                     [
                       wall, wall,            wall,             wall,   wall,   wall,   wall,
                       wall, Piece.whiteLion, Piece.whiteChick, vacant, vacant, vacant, wall,
                       wall, vacant,          Piece.whiteDog,   vacant, vacant, vacant, wall,
                       wall, vacant,          Piece.blackDog,   vacant, vacant, vacant, wall,
                       wall, vacant,          vacant,           vacant, vacant, vacant, wall,
                       wall, vacant,          vacant,           vacant, vacant, vacant, wall,
                       wall, Piece.blackLion, vacant,           vacant, vacant, vacant, wall,
                       wall, wall,            wall,             wall,   wall,   wall,   wall
                     ],
                     [Piece.blackChick],
                     [],
                     null
                   ).getLegalMoves()));

    assert.ok(some(move => move.equals(new Move(null, 0, 15)),
                   new State(
                     Player.black,
                     [
                       wall, wall,            wall,             wall,   wall,   wall,   wall,
                       wall, Piece.whiteLion, Piece.whiteChick, vacant, vacant, vacant, wall,
                       wall, vacant,          Piece.whiteChick, vacant, vacant, vacant, wall,
                       wall, vacant,          Piece.blackChick, vacant, vacant, vacant, wall,
                       wall, vacant,          vacant,           vacant, vacant, vacant, wall,
                       wall, vacant,          vacant,           vacant, vacant, vacant, wall,
                       wall, Piece.blackLion, vacant,           vacant, vacant, vacant, wall,
                       wall, wall,            wall,             wall,   wall,   wall,   wall
                     ],
                     [Piece.blackChick],
                     [],
                     null
                   ).getLegalMoves()));

    assert.ok(some(move => move.equals(new Move(null, 0, 15)),
                   new State(
                     Player.black,
                     [
                       wall, wall,            wall,             wall,   wall,   wall,   wall,
                       wall, Piece.whiteLion, vacant,           vacant, vacant, vacant, wall,
                       wall, vacant,          Piece.whiteChick, vacant, vacant, vacant, wall,
                       wall, vacant,          Piece.blackDog,   vacant, vacant, vacant, wall,
                       wall, vacant,          vacant,           vacant, vacant, vacant, wall,
                       wall, vacant,          vacant,           vacant, vacant, vacant, wall,
                       wall, Piece.blackLion, vacant,           vacant, vacant, vacant, wall,
                       wall, wall,            wall,             wall,   wall,   wall,   wall
                     ],
                     [Piece.blackChick],
                     [],
                     null
                   ).getLegalMoves()));

    assert.ok(!some(move => move.equals(new Move(null, 0, 15)),
                    new State(
                      Player.black,
                      [
                        wall, wall,            wall,             wall,           wall,   wall,   wall,
                        wall, Piece.whiteLion, vacant,           vacant,         vacant, vacant, wall,
                        wall, vacant,          Piece.whiteChick, Piece.blackCat, vacant, vacant, wall,
                        wall, vacant,          Piece.blackDog,   vacant,         vacant, vacant, wall,
                        wall, vacant,          vacant,           vacant,         vacant, vacant, wall,
                        wall, vacant,          vacant,           vacant,         vacant, vacant, wall,
                        wall, Piece.blackLion, vacant,           vacant,         vacant, vacant, wall,
                        wall, wall,            wall,             wall,           wall,   wall,   wall
                      ],
                      [Piece.blackChick],
                      [],
                      null
                    ).getLegalMoves()));
  });

  it('JSON', () => {
    const state1 = new State().doMove(new Move(30, null, 23)).doMove(new Move(25, null, 32)).doMove(new Move(23, null, 16)).doMove(new Move(9, null, 16));
    const state2 = JSON.parse(JSON.stringify(state1));

    assert.deepEqual(state1, state2);
  });

  it('equals', () => {
    assert.ok(new State().equals(new State()));
  });
});

// let s = new State();
// console.log(s.toString());
// console.log();

// for (; !s.winner;) {
//   const moves = Array.from(s.getLegalMoves());
//   s = s.doMove(moves[Math.floor(Math.random() * moves.length)]);

//   console.log(s.toString());
//   console.log();
// }
