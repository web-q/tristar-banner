# TriStar DoubleClick Banner Instructions
 
## Getting started

Install dependencies by using "**npm install**".

Begin development by typing "**gulp**" into your command line. This should spin up a server and serve the contents of your 'dev' directory.

As you make changes to the *index.handlebars*, *script.js* and *style.scss* files, your browser will update and show you the changes you've made. The SCSS file is converted to CSS on the fly, the .handlebars is converted to .html. Do **not** edit the HTML, CSS file directly because it will be overwritten.

## Building files for delivery

When you're ready to ready to build out your banner to show your client or deliver it to a media company, you use the "**gulp build**" command. This will take the contents of your 'dev' directory and minify each file. The 'dist' folder will then contain these minified files. You can upload these to a preview server to share with a client. In the 'delivery' you will also find these files zipped and ready to upload into DoubleClick Studio.
