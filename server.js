const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const http = require("https");
const path = require("path");
const Port = process.env.PORT;
const apiKeyMailChimp = "3738f098fc92d7a102336e2f31e9a385-us8"; // replace us'X' in api endpoint with us'last number in api key ie 8 in this case so with us8'
const audienceID = "c37a355fe5"; //also called listID to/from where you want to add/delete/update/request members
const app = express();
let Name;
let email;

// get homepage and return the Main HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/html/index.html"));
});

// const staticPath ='D:\node_projects\express_server\newsletter\public\assets\google.png'
// console.log(path.join(__dirname+'/public/assets/google.png'))

// use the public folder to serve the additional HTML, JS, CSS and assets to the static page
app.use(express.static(path.join(__dirname + "/public")));

// extend body parser to parse the values of form from html
app.use(bodyParser.urlencoded({ extended: true }));

// get the name and email from the signup form
app.post("/", (req, res) => {
  // console.log(req.body)
  Name = req.body["firstname"] + " " + req.body["lastname"];
  email = req.body["email"];
  //   console.log(Name, ' ', email)

  if (req.body["firstname"] && req.body["lastname"] && req.body["email"]) {
    // create a JSON to send to mailchimp servers for adding audience list
    const data = {
      members: [
        {
          email_address: email,
          status: "subscribed",
          merge_fields: {
            FNAME: req.body["firstname"],
            LNAME: req.body["lastname"],
          },
        },
      ],
    };
    console.log(data.members[0].merge_fields.FNAME);
    console.log(data.members[0].merge_fields.LNAME);

    //convert the data to JSON for mailchimp servers
    const jsonData = JSON.stringify(data);

    //mailchimp endpoint url
    const url = "https://us8.api.mailchimp.com/3.0/lists/c37a355fe5";

    // options for url
    const options = {
      method: "POST",
      auth: `${Name}:${apiKeyMailChimp}`,
    };

    //using HTTPS request to send the JSON to add to mailchimp
    // saving it as a constant to use it again and again
    const requestData = http.request(url, options, (response) => {
      if (response.statusCode === 200) res.redirect("/signupsuccess");
      else res.redirect("/failure");

      response.on("data", (data) => {
        console.log(JSON.parse(data));
      });
    });

    //passing JSON data to mailchimp server
    requestData.write(jsonData);
    requestData.end();
  } else {
    res.redirect("/failure");
  }
});

app.post("/failure", (req, res) => {
  res.redirect("/");
});

app.post("/signupsuccess", (req, res) => {
  res.redirect("/");
});

// when signup is a success route to signup success page this page and to show all the members in the audience
app.get("/signupsuccess", (req, res) => {
  // serve the success HTML file
  res.sendFile(path.join(__dirname, "/public/html", "/success.html"));

  //define options for api endpoint url
  const options = {
    method: "GET",
    auth: `${Name}:${apiKeyMailChimp}`,
  };

  // reques the members info from mailchimp api
  const reqInfoMembers = http.get(
    "https://us8.api.mailchimp.com/3.0/lists/c37a355fe5/members",
    options,
    (response) => {
      //on reciveing the JSON data from api
      var data;
      response.on("data", (chunk) => {
        // JSON is divided into chunks of data so we check for the chunk of data and append to the previous data

        if (!data) data = chunk;
        else data += chunk;
      });
      // when data recieving is finished we parse the complete JSON data into an const and call memInfo function with the parsed data as its argument
      response.on("end", () => {
        const info = JSON.parse(data);
        console.log(info.total_items); //log the total members in an audience list
        // memInfo(info);
      });
    }
  );
  //memInfo logs the members information on a particular list/audience
  //   function memInfo(data) {
  //     console.log("This is the requested members data \n");
  //     console.log(
  //       data.members.map((data) => {
  //         return {
  //           email: data.email_address,
  //           name: data.full_name,
  //           status: data.status,
  //         };
  //       })
  //     );
  //   }
});

app.get("/failure", (req, res) => {
  res.sendFile(path.join(__dirname, "/public", "/html", "/failure.html"));
});

app.listen(Port || 3000, () => {
  console.log("server started at port " + (Port ? Port : 3000));
});
