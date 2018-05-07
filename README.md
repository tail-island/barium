# barium

「ごろごろどうぶつしょうぎ」の、AI対戦向けのプラットフォームです。

## Installation

~~~sh
$ git clone https://github.com/tail-island/barium.git
$ cd barium
$ npm install
$ npm run webpack
~~~

## Usage

サーバーは、以下のコマンドで実行してください。

~~~sh
$ npm run server
~~~

サンプルAIは、以下のコマンドで実行してください。

~~~sh
$ npm run sample
~~~

サーバーの実行後にAIを2つ実行すると、ゲーム開始となります（最初に実行したAIが先手、次に実行したAIが後手です）。ゲームの状況は、`npm run server`したコンソールに表示されます。

AIと対戦する場合は、AIを実行するかわりに、Webブラウザーで`index.html`を開いて（もしくはリロードして）ください。
