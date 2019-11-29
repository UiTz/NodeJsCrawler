'use strict'
!function () {
  const Koa = require( 'koa' )
  const KoaRouter = require( 'koa-router' )
  const router = new KoaRouter()
  const KoaStatic = require( 'koa-static' )
  const app = new Koa()
  const bodyParser = require( 'koa-bodyparser' )
  const axios = require( 'axios' )
  const cheerio = require( 'cheerio' )
  const fs = require( 'fs' )
  const path = require( 'path' )

  const port = '9080'


  // const url = 'http://www.qscmall.cn/pdShow.php?cid=772'
  const url = 'http://www.qscmall.cn/pdShow.php?cid=773'
  // 初始化商品对象
  const obj = {
    prodectName: '',    // 商品名称
    prodectImgs: [],    // 商品图片
    price: '',   // 商品价格
    originPrice: '',   // 商品原价
    byje: '',   // 商品包邮价格
    sales: ''   // 产品销量
  }

  // 设置静态资源目录
  app.use( KoaStatic( path.join( __dirname, './public' ) ) )
  // 使用bodyParser中间件
  app.use( bodyParser() )
  var $ = ''


  // function writeFile(obj) {
  //   var str = JSON.stringify(obj);
  //   fs.writeFileSync('./config/data.json', str, function (err) {
  //     if (err) {
  //       console.error(err);
  //     }
  //     console.log('----------保存成功-------------');
  //   })
  // }


  // writeFile({
  //   name: 'dingding',
  //   phone: 123123
  // })

  router.get( '/test', async ctx => {

    let data1 = await axios.get( url )

    if ( data1.status === 200 ) {
      $ = cheerio.load( data1.data, { decodeEntities: false } )
      // 获取商品名称
      obj.prodectName = $( '.xiang_tit h2' ).html()
      // 获取商品图片
      let imgs = []
      $( '#tsImgSCon' ).find( 'ul li img' ).each( function ( index, item ) {
        imgs.push( 'http://www.qscmall.cn/' + $( item ).attr( 'src' ) )
      } )
      obj.prodectImgs = imgs

      // 获取商品销售价格
      obj.price = $( '#curPrice2' ).text()

      // 获取商品原价
      obj.originPrice = $( '.xiang_tit2_2 s' ).text()
      // 获取包邮金额
      obj.byje = $( '.xiang_tit2_2' ).eq( 2 ).text()
      // 获取产品销量
      obj.sales = $( '.red' ).eq( 0 ).text()
      console.log( obj )
      // res.send( CircularJSON.stringify() )
      ctx.response.body = obj.sales

    }

  } )


  // 加载路由中间件
  app.use( router.routes() ).use( router.allowedMethods() )

  app.listen( port, () => {
    console.log( `linsten at http://localhost:${port}/` )
  } )

}()
