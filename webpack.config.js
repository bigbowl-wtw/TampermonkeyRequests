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
            },
            pretty: true,
            // strict: false,
        }),
    ],
    optimization: {
        // 完全禁用压缩(会导致下面的配置项全部失效), 防止在greasyfork上被举报为加密/最小化代码
        // minimize: false,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                // extractComments: true,
                terserOptions: {
                    // 以下四项为禁用代码压缩 + 不压缩标识符
                    mangle: false,
                    compress: false,
                    keep_fnames: true,
                    keep_classnames: true,
                    format: {
                        // 输出格式化, 防止在greasyfork上被举报为最小化代码
                        beautify: true,
                        // 删除注释
                        // comments: true,
                    },
                },
            }),
        ],
    },
};
