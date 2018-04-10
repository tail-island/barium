import 'babel-polyfill';

import window_load_createjs from 'window_load_createjs';
import {State} from './game';
import {UI} from './ui';

const ui = new UI();

(async () => {
  const socket = new WebSocket('ws://localhost:8080/');

  const winnerPromise = await (async function _(state) {
    const lastMove = JSON.parse((await new Promise(resolve => socket.addEventListener('message', resolve, {once: true}))).data).lastMove;  // 状態は自前で管理するので、lastMove以外は捨てちゃいます。

    const lastState = state.doMove(lastMove);
    await ui.doMove(lastMove);

    await new Promise(resolve => {
      document.getElementById('xxx').addEventListener('click', resolve, {once: true});
    });

    const legalMoves = Array.from(lastState.getLegalMoves());
    const move = legalMoves[Math.floor(Math.random() * legalMoves.length)];

    const nextState = lastState.doMove(move);
    await ui.doMove(move);

    socket.send(JSON.stringify(move));

    return await _(nextState);
  })(new State());
})();
