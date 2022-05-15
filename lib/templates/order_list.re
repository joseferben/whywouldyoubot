open Tyxml;

let createElement = (~title, _: list(Models.Customer.t)) => {
  <html>
    <head>
      <title> {Html.txt(title)} </title>
      <link rel="stylesheet" href="home.css" />
    </head>
    <body />
  </html>;
};
