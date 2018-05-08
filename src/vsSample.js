import 'babel-polyfill';

import {Player, State} from './game';
import {getMove}       from './sampleAi';
import {UI}            from './ui';

(async () => {
  // Chromeで画像の読み込みに時間がかかってしまう場合があったので、ダーティ・ハック……。
  await new Promise(resolve => setTimeout(resolve, 100));

  document.body.style.cursor = 'wait';

  const ui = new UI();

  const winner = await (async function _(state1) {
    document.body.style.cursor = 'auto';
    const move1 = await ui.getMove(Array.from(state1.getLegalMoves()));
    document.body.style.cursor = 'wait';

    await new Promise(resolve => setTimeout(resolve, 100));
    await ui.doMove(move1);

    const state2 = state1.doMove(move1);
    if (state2.winner) {
      return state2.winner;
    }

    const move2 = getMove(state2);

    await new Promise(resolve => setTimeout(resolve, 100));
    await ui.doMove(move2);

    const state3 = state2.doMove(move2);
    if (state3.winner) {
      return state3.winner;
    }

    return await _(state3);
  })(new State());

  document.body.style.cursor = 'auto';

  ui.drawMessage(winner === null ? '引き分け' : winner === Player.black ? '勝ち' : '負け');
})();
