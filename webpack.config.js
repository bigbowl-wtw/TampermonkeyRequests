const { UserscriptPlugin } = require('webpack-userscript');
const TerserPlugin = require('terser-webpack-plugin');
// const { DefinePlugin } = require('webpack');
const path = require('path');
const _ = require('./package.json');
// const nodeExternals = require("webpack-node-externals");

_.name = 'GM Requests';

module.exports = {
    mode: 'production',
    entry: path.resolve(__dirname, 'src', 'index.ts'),
    externalsPresets: { node: true },
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
    },
    output: {
        filename: `${_.name.replace(' ', '-').toLowerCase()}.js`,
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: 'requests',
            type: 'umd',
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: path.resolve(
                                __dirname,
                                './tsconfig.json'
                            ),
                        },
                    },
                ],
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        // 生成userscript header信息
        new UserscriptPlugin({
            headers: {
                name: _.name,
                version: _.version,
                author: _.author,
                license: 'MIT',
                namespace: 'com.github.bigbowl-wtw',
                supportURL: _.bugs.url,
                homepage: _.homepage,
                description: _.description,
                grant: ['GM_xmlhttpRequest'],
                match: 'none',
            },
            pretty: true,
            // strict: false,
        }),
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                extractComments: true,
                terserOptions: {
                    compress: true,
                },
            }),
        ],
    },
};
