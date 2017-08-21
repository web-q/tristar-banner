# TriStar DoubleClick Banners

## Prerequisites

git

node.js 6.x+

## Getting started

Clone the GIT repository:

"**git clone https://github.com/web-q/tristar-banner.git**"

Install dependencies by using "**npm install**".

Begin development by typing "**gulp --size 300x250|320x50|728x90**" into your command line. This should spin up a server and serve the contents of your 'size/dev' directory, where "size is the value of the "--size" parameter".

As you make changes to the *index.handlebars*, *script.js* and *style.scss* files, your browser will update and show you the changes you've made. The SCSS file is converted to CSS on the fly, the .handlebars is converted to .html. Do **not** edit the HTML, CSS file directly because it will be overwritten.

## Building files for delivery

When you're ready to ready to build out your banner to show your client or deliver it to a media company, you use the "**gulp build [--size 300x250|320x50|728x90]**" command. This will take the contents of your '[size/]dev' directory and minify each file. The '[size/]dist' folder will then contain these minified files. You can upload these to a preview server to share with a client. In the '[size/]delivery' you will also find these files zipped and ready to upload into DoubleClick Studio. Size parameter is optional. The build task without the size parameter will build all sizes.

