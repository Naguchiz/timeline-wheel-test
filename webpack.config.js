const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
  const isProd = argv.mode === "production";

  return {
    entry: path.resolve(__dirname, "src/index.tsx"),

    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProd ? "assets/[name].[contenthash].js" : "assets/[name].js",
      clean: true,
      publicPath: "/",
    },

    resolve: {
      extensions: [".ts", ".tsx", ".js"],
    },

    devtool: isProd ? "source-map" : "eval-cheap-module-source-map",

    module: {
      rules: [
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          use: ["@svgr/webpack"],
        },
        {
          test: /\.[tj]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                ["@babel/preset-env", { targets: "defaults" }],
                ["@babel/preset-react", { runtime: "automatic" }],
                "@babel/preset-typescript",
              ],
            },
          },
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public/index.html"),
      }),
    ],

    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: true,
      static: {
        directory: path.resolve(__dirname, "public"),
      },
    },
  };
};
