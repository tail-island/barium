import {first, isEmpty, reduce, reduced} from 'folivora';
import {PieceType, State, vacant, wall} from './game';
import {client as WebSocketClient} from 'websocket';

// 駒の価値を計算する関数。
const getPieceValue = (piece) => {
  switch (piece.type) {
  case PieceType.chick:      return    100;
  case PieceType.chicken:    return   1200;
  case PieceType.cat:        return   1000;
  case PieceType.powerUpCat: return   1200;
  case PieceType.dog:        return   1200;
  case PieceType.lion:       return 100000;
  default:                   throw('Illegal argument.');
  };
};

// いわゆる評価関数です。
const evaluate = (() => {
  // とりあえず、駒得で作ってみました……。ヘッポコです。

  const rule = new Map([
    [PieceType.chick,        100],
    [PieceType.chicken,     1200],
    [PieceType.cat,         1000],
    [PieceType.powerUpCat,  1200],
    [PieceType.dog,         1200],
    [PieceType.lion,       10000]
  ]);

  return (state) => {
    return (reduce((acc, piece) => acc + (piece !== vacant && piece !== wall ? rule.get(piece.type) * (piece.owner == state.player ? 1 : -1) : 0), 0, state.board) +
            reduce((acc, piece) => acc + rule.get(piece.type), 0, state.capturedPieces) +
            reduce((acc, piece) => acc - rule.get(piece.type), 0, state.enemyCapturedPieces));
  };
})();

// TODO: 二層目からはmoveを使わないようにする。
// TODO: メモ化！
export const getMove = (state) => {
  const getScore = (state, depth, alpha, beta) => {
    if (state.winner) {
      return state.winner === state.player ? 100000 : -100000;
    }

    if (depth === 0 || isEmpty(state.getLegalMoves())) {
      return evaluate(state);
    }

    return first(getScoreAndMove(state, depth, alpha, beta));
  };

  const getScoreAndMove = (state, depth, alpha, beta) => {
    return reduce((acc, move) => {
      const score = -getScore(state.doMove(move), depth - 1, -beta, -acc[0]);

      if (score > acc[0]) {
        acc = [score, move];
      }

      return acc[0] >= beta ? reduced(acc) : acc;
    }, [alpha, null], state.getLegalMoves());
  };

  return getScoreAndMove(state, 5, -Infinity, Infinity)[1];
};

(async () => {
  const client = new WebSocketClient();
  client.connect('ws://localhost:8080');

  const connection = await new Promise(resolve => client.once('connect', resolve));

  (async function _(state) {
    const message = await new Promise(resolve => connection.once('message', resolve));

    const lastMove = JSON.parse(message.utf8Data).lastMove;  // 状態は自前で管理するので、lastMove以外は捨てちゃいます。
    const lastState = state.doMove(lastMove);

    const nextMove = getMove(lastState);
    const nextState = lastState.doMove(nextMove);

    connection.sendUTF(JSON.stringify(nextMove));

    return await _(nextState);
  })(new State());
})();
