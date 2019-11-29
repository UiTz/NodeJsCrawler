'use strict'
!function () {
  const Koa = require( 'koa' )
  const KoaRouter = require( 'koa-router' )
  const router = new KoaRouter()
  const KoaStatic = require( 'koa-static' )
  const app = new Koa()
  const bodyParser = require( 'koa-bodyparser' )
  const Axios = require( 'axios' )
  const cheerio = require( 'cheerio' )
  const fs = require( 'fs' )
  const path = require( 'path' )

  const axios = Axios.create( {
    baseURL: 'http://www.qscmall.cn'
  } )


  // 设置静态资源目录
  app.use( KoaStatic( path.join( __dirname, './public' ) ) )
  // 使用bodyParser中间件
  app.use( bodyParser() )
  var $ = ''
  // const url = 'http://www.qscmall.cn/pdShow.php?cid=772'
  const port = '9080'
  // 初始化商品对象
  const products = {
    count: 0,
    productList: []
  }
  // 初始化商品编号数组
  var productId = []
  // 初始化获取失败个数
  var errNum = 0
  // 是否成功获取商品编号
  var loadSuccessful = false
  // 能否继续
  var isContinue = true

  // 将数据保存到本地JSON 文件当中
  function writeFile ( obj ) {
    var str = JSON.stringify( obj )
    fs.writeFile( './config/data.json', str, function ( err ) {
      if ( err ) throw err
      console.log( '共保存' + products.count + '条数据' )
      console.log( '----------保存成功-------------' )
    } )
  }

  // 爬取商品数据保存到对象products.productList 数组当中
  async function getDetails ( id, n ) {
    if ( isContinue ) {
      isContinue = false
      // 初始化商品对象
      const obj = {
        id,
        prodectName: '',    // 商品名称
        prodectImgs: [],    // 商品图片
        price: '',   // 商品价格
        originPrice: '',   // 商品原价
        byje: '',   // 商品包邮价格
        sales: '',   // 产品销量
        curPrice: '', // 小计
        introduction: [] // 商品详情介绍
      }

      try {
        let data1 = await axios.get( '/pdShow.php?cid=' + id )
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
          // 获取小计
          obj.curPrice = $( '#curPrice' ).text()
          // res.send( CircularJSON.stringify() )
          // 获取商品介绍详情
          let details = []
          $( '.c_left' ).find( ' img' ).each( function ( index, item ) {
            details.push( 'http://www.qscmall.cn/' + $( item ).attr( 'src' ) )
          } )
          obj.introduction = details
          // ctx.response.body =

          // writeFile( [obj] )

          products.productList.push( obj )
          products.count = products.count + 1
          isContinue = true
          console.log( (products.count) + '条商品数据保存成功' )
          return true
        } else {
          return false
        }
      } catch (e) {
        console.log( '一条商品的数据获取失败' )
        errNum = errNum + 1
        return false
      }
    }


  }

  // 请求首页数据获取所有商品的编号
  async function getProductId () {
    try {
      console.log( '正在获取商品编号' )
      let res = await axios.get( '' )
      if ( res.status === 200 ) {
        $ = cheerio.load( res.data, { decodeEntities: false } )
        let idArr = []
        $( '.products' ).find( ' ul li a' ).each( ( index, item ) => {
          let i = $( item ).attr( 'href' ).split( '=' )[1]
          idArr.push( i )
        } )
        // console.log( idArr )
        loadSuccessful = true
        console.log( '成功获取商品编号,共' + idArr.length + '条' )
        return idArr
      } else {
        console.log( '获取首页商品信息失败' )
        return false
      }
    } catch (e) {
      console.log( '获取首页商品信息失败' )
    }
  }

  async function runStart () {
    productId = await getProductId()
    let n = 0
    let siv = await setInterval( async () => {
      if ( loadSuccessful && isContinue ) {
        if ( (n + 1) === productId.length ) {
          clearInterval( siv )
          console.log( '正在写入文件' )
          writeFile( products )
        } else {
          let res = await getDetails( productId[n] )
          ++ n
        }
      }
    }, 10 )
  }

  // 启动程序
  // runStart()


  router.get( '/test', async ctx => {
    // 请求首页数据获取所有商品的编号
    ctx.body = await getProductId()

  } )


  // 加载路由中间件
  app.use( router.routes() ).use( router.allowedMethods() )

  app.listen( port, () => {
    console.log( `linsten at http://localhost:${port}/` )
  } )

}()
