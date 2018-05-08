import {client as WebSocketClient} from 'websocket';
import {State} from './game';
import {getMove} from './sampleAi';

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
