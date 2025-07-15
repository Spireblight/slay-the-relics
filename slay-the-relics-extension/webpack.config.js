const fs = require('fs')
const path = require("path")
const webpack = require("webpack")

const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

// defines where the bundle file will live
const bundlePath = path.resolve(__dirname, "dist/")

module.exports = (_env, argv) => {
    let entryPoints = {
        VideoOverlay: {
            path: "./src/VideoOverlay.js",
            outputHtml: "video_overlay.html",
            build: true
        },
    }

    let entry = {}

    // edit webpack plugins here!
    let plugins = [
        new CleanWebpackPlugin({cleanAfterEveryBuildPatterns: ['dist']}),
        new webpack.HotModuleReplacementPlugin()
    ]

    for (name in entryPoints) {
        if (entryPoints[name].build) {
            entry[name] = entryPoints[name].path
            if (argv.mode === 'production') {
                plugins.push(new HtmlWebpackPlugin({
                    inject: true,
                    chunks: [name],
                    template: './template.html',
                    filename: entryPoints[name].outputHtml
                }))
            }
        }
    }

    let config = {
        //entry points for webpack- remove if not used/needed
        entry,
        optimization: {
            minimize: false, // this setting is default to false to pass review more easily. you can opt to set this to true to compress the bundles, but also expect an email from the review team to get the full source otherwise.
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx|tx|tsx)$/,
                    exclude: /(node_modules|bower_components)/,
                    loader: 'babel-loader',
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader']
                },
                {
                    test: /\.scss$/,
                    use: [
                        "style-loader", // creates style nodes from js strings
                        "css-loader", // translates css into commonjs
                        "sass-loader", // compiles sass to css, using node sass by default
                    ]
                },
            ]
        },
        resolve: {extensions: ['*', '.js', '.jsx', '.ts', '.tsx', '.png']},
        output: {
            filename: "[name].bundle.js",
            path: bundlePath
        },
        plugins
    }

    if (argv.mode === 'development') {
        config.devServer = {
            static: path.join(__dirname, 'public'),
            host: 'localhost',
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            port: 8080,
        }
    }
    if (argv.mode === 'production') {
        config.optimization.splitChunks = {
            cacheGroups: {
                default: false,
                vendors: false,
                vendor: {
                    chunks: 'all',
                    test: /node_modules/,
                    name: false
                }
            },
            name: false
        }
    }

    return config;
}