import {State} from './game';
import {client as WebSocketClient} from 'websocket';

(async () => {
  const client = new WebSocketClient();
  client.connect('ws://localhost:8080');

  const connection = await new Promise(resolve => client.once('connect', resolve));

  (async function _(state) {
    const message = await new Promise(resolve => connection.once('message', resolve));

    const lastMove = JSON.parse(message.utf8Data).lastMove;  // 状態は自前で管理するので、lastMove以外は捨てちゃいます。

    const lastState = state.doMove(lastMove);

    const legalMoves = Array.from(lastState.getLegalMoves());
    const move = legalMoves[Math.floor(Math.random() * legalMoves.length)];

    const nextState = lastState.doMove(move);

    connection.sendUTF(JSON.stringify(move));

    return await _(nextState);
  })(new State());
})();
