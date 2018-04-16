import {reduce, reduced} from 'folivora';
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
  // アルファ・ベータ法（正しくはネガ・アルファ法）で、盤面のスコアを計算します。
  const getScore = (state, depth, alpha, beta) => {
    const hashcode = state.hashcode();
    const memo = memos.get(hashcode);

    // 過去に同じ盤面のスコアを計算していた場合は、その値をそのまま返します。ハッシュ値がたまたま等しい異なる状態の場合は不正な動作になりますけど、気にしない方向で。HashMap欲しいなぁ……。
    if (memo && memo.depth >= depth && memo.alpha <= alpha && memo.beta >= beta) {
      return memo.score;
    }

    // 勝者が確定している場合は、探索を止めて大きな値を返します。
    if (state.winner) {
      return state.winner === state.player ? 100000 : -100000;
    }

    // 合法手を取得します。
    const legalMoves = Array.from(state.getLegalMoves());

    // 十分深く探索した、もしくは、合法手がない場合は、盤面を評価してスコアとします。
    if (depth === 1 || legalMoves.length === 0) {  // 外側で余分に一回回しているので、depth === 0じゃなくて1にしました。
      return evaluate(state);
    }

    // TODO: すべての手で軽くスコアを調べて、スコアが大きい順にソートして、枝刈りの効果を高める。

    // そうでなければ、合法手を使って1手進めた盤面で自分自身を呼び出して、スコアを計算します。
    const score = reduce((acc, move) => {
      const score = -getScore(state.doMove(move), depth - 1, -beta, -acc);
      const nextAcc = score > acc ? score : acc;  // TODO: スコアが同じ場合にランダムで入れ替えると、手に幅がでて良いかも。

      return nextAcc >= beta ? reduced(nextAcc) : nextAcc;
    }, alpha, legalMoves);

    // 計算したスコアをメモしておきます。
    memos.set(hashcode, {state: state, depth: depth, alpha: alpha, beta: beta, score: score});

    // スコアをリターンします。
    return score;
  };

  // スコアのメモ。
  const memos = new Map();

  // 手を返せるように、スコアと手の配列をaccにするアルファ・ベータ法（正しくはネガ・アルファ法）を実行します。getScoreを手も扱うように改造すればコードの重複がなくなるのですけど、配列の生成は遅そうなので、敢えてこんなコードにしてみました。
  return (state) => {
    const [score, move] = reduce((acc, move) => {
      const score = -getScore(state.doMove(move), 4, -1000000, -acc[0]);
      const nextAcc = score > acc[0] ? [score, move] : acc;  // TODO: スコアが同じ場合にランダムで入れ替えると、手に幅がでて良いかも。

      return nextAcc;
    }, [-1000000, null], state.getLegalMoves());  // TODO: 合法手が全く無い場合にnullが返るけど、大丈夫？

    console.log(score);

    return move;
  };
})();

(async () => {
  // WebSocketをオープンします。
  const client = new WebSocketClient();
  client.connect('ws://localhost:8080');

  // コネクションを取得します。
  const connection = await new Promise(resolve => client.once('connect', resolve));

  // メッセージをやり取りしてゲームを進める関数を定義して、実行します。
  (async function _(state) {
    // メッセージを取得します。
    const message = await new Promise(resolve => connection.once('message', resolve));

    // 敵の手を実行して、盤面を進めます。
    const lastMove = JSON.parse(message.utf8Data).lastMove;  // 状態は自前で管理するので、lastMove以外は捨てちゃいます。
    const lastState = lastMove? state.doMove(lastMove) : state;

    // 自分の手を実行して、盤面を進めます。
    const nextMove = getMove(lastState);
    const nextState = lastState.doMove(nextMove);

    // メッセージを送信します。
    connection.sendUTF(JSON.stringify(nextMove));

    // 再帰呼び出しして、ゲームを進めます。
    return await _(nextState);
  })(new State());
})();
