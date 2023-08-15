/*
 * @Author: Jerryk jerry@icewhale.org
 * @Date: 2022-02-18 10:20:10
 * @LastEditors: zhanghengxin ezreal.zhang@icewhale.org
 * @LastEditTime: 2023-08-10 00:03:38
 * @FilePath: /CasaOS-UI/main/vue.config.js
 * @Description:
 *
 * Copyright (c) 2022 by IceWhale, All Rights Reserved.
 */

const webpack = require('webpack')
const path = require("path")

const commitHash = require('child_process')
	.execSync('git describe --always')
	.toString()
	.trim();

const globalSassFiles = [
	"./src/assets/scss/common/_variables.scss",
	"./src/assets/scss/common/_color.scss"
]


module.exports = {
	publicPath: '/',
	runtimeCompiler: true,
	lintOnSave: false,
	productionSourceMap: true,
	pluginOptions: {
		// "runtime-plugin": {}
	},
	css: {
		extract: {
			ignoreOrder: true
		},
		loaderOptions: {
			css: {
				modules: {
					auto: () => true
				}
			}
		},
		// modules: {
		// 	localIdentName: '[name]-[hash]',
		// 	exportLocalsConvention: 'camelCaseOnly'
		// }
	},
	transpileDependencies: ['marked'],
	configureWebpack: {
		resolve: {
			fallback: {
				timers: require.resolve('timers-browserify'),
				"url": require.resolve("url"),
				"https": require.resolve("https-browserify"),
				"http": require.resolve("stream-http"),
				"stream": require.resolve("stream-browserify")
			}
		},
		module: {
			rules: [
				// {
				// 	test: /\.esm\.js$/,
				// 	include: [
				// 		path.resolve(__dirname, "src"),
				// 		path.resolve(__dirname, "node_modules/marked")
				// 	],
				// 	use: {
				// 		loader: 'esbuild-loader',
				// 		options: {
				// 			target: 'es2020',
				// 			jsxFactory: 'h',
				// 			jsxFragment: 'Fragment'
				// 		}
				// 	}
				// },
				// {
				// 	test: /\.s?css$/,
				// 	use: ["css-loader", "sass-loader"]
				// },
				// {
				// 	test: /\.css$/,
				// 	use: ["style-loader", "css-loader"]
				// }
			]
		}
	},
	chainWebpack: config => {
		config.module
			.rule("mjs")
			.test(/\.mjs$/)
			.type("javascript/auto")
			.include.add(/node_modules/)
			.end();

		const oneOfsMap = config.module.rule("scss").oneOfs.store;
		oneOfsMap.forEach(item => {
			// item
			// 	.use("style-resources-loader")
			// 	.loader("style-resources-loader")
			// 	.options({
			// 		patterns: [
			// 			"./src/assets/scss/common/_variables.scss",
			// 			"./src/assets/scss/common/_color.scss"
			// 		]
			// 	})
			// 	.end()
			item.use("sass-resources-loader")
				.loader("sass-resources-loader")
				.options({
					resources: globalSassFiles
				})
				.end();
		})
		config.plugin('ignore')
			.use(new webpack.IgnorePlugin({resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/}));
		config.plugin('define')
			.use(require('webpack/lib/DefinePlugin'), [{
				'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
				'process.env.VUE_APP_DEV_IP': JSON.stringify(process.env.VUE_APP_DEV_IP),
				'process.env.VUE_APP_DEV_PORT': JSON.stringify(process.env.VUE_APP_DEV_PORT),
				'process.env.VUE_APP_BASE_URL': JSON.stringify(process.env.VUE_APP_BASE_URL),
				MAIN_APP_VERSION_ID: JSON.stringify(commitHash),
				BUILT_TIME: JSON.stringify(Date()),
			}]);
		// Production only
		if (process.env.NODE_ENV === "prod") {
			config.output.filename('[name].[contenthash:8].js').end()
			config.output.chunkFilename('[name].[contenthash:8].js').end()
			config.optimization.minimize(true);
			config.optimization.splitChunks({
				chunks: 'all'
			})

			config.optimization
				.minimizer('css')
				.use(require.resolve('optimize-css-assets-webpack-plugin'), [{cssProcessorOptions: {safe: true}}])
		} else if (process.env.NODE_ENV === 'test') {
			// 添加对 Vue 文件中的 CSS 的处理规则
			config.module
				.rule('vue')
				.use('vue-loader')
				.tap((options) => {
					options.transformAssetUrls = {
						// 在 Vue 文件中引用的 CSS 也会被处理
						'style': ['css-loader', 'sass-loader'],
					};
					return options;
				});

			// 添加对 CSS 的处理规则
			config.module
				.rule('css')
				.oneOf('vue')
				.use('postcss-loader')
				.tap((options) => {
					// 添加 PostCSS 插件的配置
					options.postcssOptions = {
						plugins: [
							require('postcss-preset-env')(),
							require('autoprefixer')(),
							// 这里可以添加其他的 PostCSS 插件
						],
					};
					return options;
				});
		} else {
			// Development only
			// config.plugin('webpack-bundle-analyzer')
			// 	.use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin)
			config.devServer.proxy({
				'/': {
					target: `http://${process.env.VUE_APP_DEV_IP}:${process.env.VUE_APP_DEV_PORT}`,
					changeOrigin: true,
				}
			})
		}
	},
	devServer: {
		open: true,
		port: 8080,
		// inline: false,
		// before: require('./mock/meta_data.js'),
		hot: true,
		// contentBase: publicPath,
	}
}
