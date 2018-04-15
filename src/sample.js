import {isEmpty, reduce, reduced} from 'folivora';
import {PieceType, State, vacant, wall} from './game';
import {client as WebSocketClient} from 'websocket';

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

  return (state) => (reduce((acc, piece) => acc + (piece !== vacant && piece !== wall ? rule.get(piece.type) * (piece.owner === state.player ? 1 : -1) : 0), 0, state.board) +
                     reduce((acc, piece) => acc + rule.get(piece.type), 0, state.capturedPieces) +
                     reduce((acc, piece) => acc - rule.get(piece.type), 0, state.enemyCapturedPieces));
})();

// 次の手を選びます。
export const getMove = (() => {
  const getScore = (state, depth, alpha, beta) => {
    const hashcode = state.hashcode();
    const memo = memos.get(hashcode);  // ハッシュ値がたまたま等しい異なる状態の場合は不正な動作になりますけど、気にしない方向で……。HashMap欲しいなぁ……。

    if (memo && memo.depth >= depth && memo.alpha <= alpha && memo.beta >= beta) {
      return memo.score;
    }

    if (state.winner) {
      return state.winner === state.player ? 100000 : -100000;
    }

    const legalMoves = Array.from(state.getLegalMoves());

    if (depth === 0 || isEmpty(legalMoves)) {
      return evaluate(state);
    }

    const score = reduce((acc, move) => {
      const score = -getScore(state.doMove(move), depth - 1, -beta, -acc);

      if (score > acc) {
        acc = score;
      }

      return acc >= beta ? reduced(acc) : acc;
    }, alpha, legalMoves);

    memos.set(hashcode, {state: state, depth: depth, alpha: alpha, beta: beta, score: score});

    return score;
  };

  const memos = new Map();

  return (state) => {
    const [score, move] = reduce((acc, move) => {
      const score = -getScore(state.doMove(move), 3, -Infinity, -acc[0]);

      if (score > acc[0]) {
        acc = [score, move];
      }

      return acc;
    }, [-Infinity, null], state.getLegalMoves());

    console.log(score);

    return move;
  };
})();

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
