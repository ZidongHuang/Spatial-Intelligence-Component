fetch("./public/data/data.json")
.then(response => {
   return response.json();
})
.then(data => console.log(data));

// document.getElementById('data').innerHTML = data