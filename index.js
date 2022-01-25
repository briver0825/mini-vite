const koa = require('koa')
const fs = require('fs')
const path = require('path')

const compileSfc = require('@vue/compiler-sfc')
const compileDom = require('@vue/compiler-dom')

const app = new koa()

function rewriteImport(content){
    return content.replace(/from ['|"](.+)['|"]/g,(s0,s1)=>{
        if(s1[0] !== '.' && s1[0]!== '/'){
            return `from '/@modules/${s1}.js'`
        }
        return s0
    })
}

app.use(ctx=>{
    const url = ctx.request.url
    // console.log(url);
    if(url === '/'){
        let content = fs.readFileSync(path.resolve(__dirname,'./index.html')).toString()
        content = `
        <script>
            window.process = {
                env:{NODE_EV:'dev'}
            }
        </script>
        ` + content
        ctx.type = 'text/html; charset=utf-8'
        ctx.body = content
    }else if(url.startsWith('/@modules')){

        const prefix = path.resolve(__dirname,'node_modules',url.replace('/@modules/','').replace('.js',''))
        const module = require(prefix + '/package.json')['module']
        const content = fs.readFileSync(prefix+`/${module}`).toString()
        ctx.type = 'application/javascript;'
        ctx.body = rewriteImport(content)
    }
    else if(url.endsWith('.vue')){
        const content = fs.readFileSync(path.resolve(__dirname,'.'+url)).toString()
        const {descriptor} = compileSfc.parse(content)
        const __script = descriptor.script.content
        const c = `
        const __script = ${__script.replace('export default ','')}

        import { render as __render } from "/src/App.vue?type=template" 
        __script.render = __render
        export default __script
        `
        ctx.type = 'application/javascript;'
        ctx.body = rewriteImport(c)
    }
    else if(url.endsWith('template')){
        const content = fs.readFileSync(path.resolve(__dirname,'.'+url).replace('?type=template','')).toString()
        const {descriptor} = compileSfc.parse(content)
        const {code} = compileDom.compile(descriptor.template.content,{mode:'module'})
        ctx.type = 'application/javascript;'
        ctx.body = rewriteImport(code)
    }
    else if(url.endsWith('.js')){
        const content = fs.readFileSync(path.resolve(__dirname,'.'+url)).toString()
        ctx.type = 'application/javascript;'
        ctx.body = rewriteImport(content)
    }else if(url.endsWith('.css')){
        const content = fs.readFileSync(path.resolve(__dirname,'.'+url)).toString()
        ctx.type = 'application/javascript;'
        ctx.body = `
        const css = \`${content}\`
            const link = document.createElement('style')
            link.setAttribute('type','text/css')
            link.innerText = css
            document.head.appendChild(link)        
            export default css
        `
    }
})

app.listen(9696)

