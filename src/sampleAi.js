import {reduce, reduced} from 'lajure';
import {PieceType, State, vacant, wall} from './game';

// 状態を評価します。
const evaluate = (() => {
  // とりあえず、駒得で作ってみました……。ごめんなさい。ヘッポコです。

  const rule = new Map([
    [PieceType.chick,        100],
    [PieceType.chicken,     1200],
    [PieceType.cat,         1000],
    [PieceType.powerUpCat,  1200],
    [PieceType.dog,         1200],
    [PieceType.lion,       10000]
  ]);

  return (state) => (reduce((acc, piece) => acc + (piece !== vacant && piece !== wall ? rule.get(piece.type) * (piece.owner === state.player ? 1 : -1) : 0), 0, state.board) +
                     reduce((acc, piece) => acc + rule.get(piece.type) *  1, 0, state.capturedPieces) +
                     reduce((acc, piece) => acc + rule.get(piece.type) * -1, 0, state.enemyCapturedPieces));
})();

// 次の手を取得します。
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

    // 指定した深さまで探索した場合は、盤面を評価してスコアとします。
    if (depth === 1) {  // 外側で余分に一回回しているので、depth === 0じゃなくて1にしました。
      return evaluate(state);
    }

    // そうでなければ、合法手を使って1手進めた盤面で自分自身を呼び出して、スコアを計算します。
    const score = reduce((acc, move) => {
      const score = -getScore(state.doMove(move), depth - 1, -beta, -acc);
      const nextAcc = score > acc ? score : acc;

      return nextAcc >= beta ? reduced(nextAcc) : nextAcc;
    }, alpha, state.getLegalMoves());

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
      const score = -getScore(state.doMove(move), 4, -1000000, -acc[0]);  // 5手読むとすげー遅かったので、読む深さは4手で。
      const nextAcc = score > acc[0] ? [score, move] : acc;  // TODO: スコアが同じ場合にランダムで入れ替えると、手に幅がでて良いかも。

      return nextAcc;
    }, [-1000000, null], state.getLegalMoves());  // TODO: 合法手が全く無い場合にnullが返るけど、大丈夫？　合法手が全くない状態が想像できないけど……。

    console.log(score);

    return move;
  };
})();
