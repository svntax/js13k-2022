const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");

const path = require("path");

const isProduction = process.env.npm_lifecycle_event === "build";

module.exports = {
  entry: "./src",
  output: {
    publicPath: "/"
  },
  devtool: !isProduction && "source-map",
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader"
          }
        ]
      },
      {
        test: require.resolve("./src/app/zzfx.js"),
        loader: "exports-loader",
        options: {
          type: "module",
          exports: ["zzfx", "zzfxP", "zzfxG", "zzfxV", "zzfxR", "zzfxX"]
        }
      },
      {
        test: require.resolve("./src/app/zzfxm.min.js"),
        loader: "exports-loader",
        options: {
          type: "module",
          exports: ["zzfxM"]
        }
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader?name=./img/[name].[ext]"
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html",
      inject: "body",
      minify: isProduction && {
        collapseWhitespace: true,
        removeComments: true,
        minifyJS: true,
        keepClosingSlash: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      },
      inlineSource: isProduction && "\.(js|css)$"
    }),
    new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin),
    new OptimizeCssAssetsPlugin({}),
    new MiniCssExtractPlugin({
      filename: "[name].css"
    })
  ],
  devServer: {
    devMiddleware: {
      stats: "minimal"
    },
    client: {
      overlay: true
    },
    static: {
      directory: path.resolve(__dirname, "./img"),
      publicPath: "/img"
    }
  }
};
