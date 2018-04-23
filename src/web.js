import 'babel-polyfill';

import {State} from './game';
import {UI} from './ui';

const ui = new UI();

(async () => {
  const socket = new WebSocket('ws://localhost:8080/');

  await (async function _(state) {
    const message = await new Promise(resolve => socket.addEventListener('message', resolve, {once: true}));

    const lastMove = JSON.parse(message.data).lastMove;  // 状態は自前で管理するので、lastMove以外は捨てちゃいます。
    const lastState = lastMove ? state.doMove(lastMove) : state;

    if (lastMove) {
      await ui.doMove(lastMove);
    }

    const legalMoves = Array.from(lastState.getLegalMoves());
    const move = await ui.getMove(legalMoves);

    const nextState = lastState.doMove(move);
    await ui.doMove(move);

    socket.send(JSON.stringify(move));

    return await _(nextState);
  })(new State());
})();
