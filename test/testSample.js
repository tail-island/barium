import {Piece, Player, State, vacant, wall} from '../src/game';
import {getMove} from '../src/sample';

const xxx = getMove(new State(
  Player.black,
  [
    wall, wall,            wall,             wall,                  wall,             wall,           wall,
    wall, vacant,          vacant,           Piece.blackPowerUpCat, vacant,           vacant,         wall,
    wall, vacant,          vacant,           vacant,                vacant,           vacant,         wall,
    wall, Piece.whiteDog,  vacant,           Piece.whiteLion,       Piece.whiteDog,   vacant,         wall,
    wall, Piece.whiteCat,  Piece.whiteChick, Piece.whiteChick,      vacant,           vacant,         wall,
    wall, Piece.blackLion, vacant,           vacant,                Piece.blackChick, vacant,         wall,
    wall, vacant,          vacant,           vacant,                Piece.blackDog,   Piece.blackCat, wall,
    wall, wall,            wall,             wall,                  wall,             wall,           wall
  ],
  [Piece.blackChick, Piece.blackChick, Piece.blackDog],
  [Piece.whiteChick, Piece.whiteCat],
  null
));

console.log(xxx);
