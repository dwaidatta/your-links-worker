import { Redis } from "@upstash/redis/cloudflare";

export default {
  async fetch(request, env) {
    const redis = Redis.fromEnv(env);

    const user_url = new URL(request.url);
    const id = user_url.pathname.slice(1).split('/')[0];

    let message = "";
    let statusCode = 200;
    let redirectUrl = null;

    // CUSTOMISE THE VALIDATION AS PER YOUR REQUIREMENTS

    if (!id || id.length < 3 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      message = "Invalid link";
      statusCode = 400;
    }
    
    else {
      const data = await redis.hgetall(`link:${id}`);

      if (!data || !data.url) {
        message = "Link not found";
        statusCode = 404;
      }
      else if (!data.enabled) {
        message = "Link is disabled";
        statusCode = 403;
      }
      else {
        // SUCCESSFUL REDIRECT
        redirectUrl = data.url;
        message = `Redirecting to: ${redirectUrl}`;
        statusCode = 200;
      }
    }

    // HTML TEMPLATE

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${redirectUrl ? 'Redirecting' : 'Error'}</title>
      ${redirectUrl ? `<meta http-equiv="refresh" content="3;url=${redirectUrl}">` : ''}
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .box {
          background: white;
          border: 2px solid #000000;
          padding: 40px;
          max-width: 500px;
          width: 100%;
          text-align: center;
        }
        .icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 24px;
          font-weight: 600;
          color: #000000;
          margin-bottom: 16px;
        }
        .message {
          color: #666;
          line-height: 1.6;
          margin-bottom: 24px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        a {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 32px;
          text-decoration: none;
          font-weight: 500;
        }
        a:hover {
          background: #5568d3;
        }
        .footer {
          margin-top: 24px;
          font-size: 13px;
          color: #999;
        }
        @media (max-width: 600px) {
          .box {
            padding: 30px 20px;
          }
          h1 {
            font-size: 20px;
          }
        }
      </style>
      </head>
      <body>
        <div class="box">
          <div class="icon">${redirectUrl ? '🌐' : '⚠️'}</div>
          <h1>${redirectUrl ? 'Redirecting...' : 'Error'}</h1>
          <div class="message">${message}</div>
          ${redirectUrl ? `<a href="${redirectUrl}">Click to Continue</a>` : ''}
          <div class="footer">${redirectUrl ? 'Auto-redirecting in 3 seconds...' : ''}</div>
        </div>
      </body>
      </html>
    `;


    // ----------------------------------------

    return new Response(html, {
      status: statusCode,
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });    
  },
};