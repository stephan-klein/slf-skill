module.exports = {
  convertCsvToJson: function(){
    console.log('Hello World');

    const dataobj = require('./csv/csvdata');
    let data = dataobj.cars;

    const struct = {

    };

    for (let i = 0; i < data.length; i++){
      let color = data[i];
      color = color.charAt(0).toUpperCase() + color.substring(1).toLowerCase();
      let letter = color.charAt(0).toUpperCase();

      if (struct[letter] === undefined){
        struct[letter] = [color];
      } else {
        struct[letter].push(color);
      }
    }

    const ordered = {};
    Object.keys(struct).sort().forEach(function(key) {
      ordered[key] = struct[key];
    });

    console.log(ordered);

    let fs = require('fs');
    fs.writeFile("data.out", JSON.stringify(ordered), function(err) {
      if(err) {
        return console.log(err);
      }

      console.log("The file was saved!");
    });
  }
};
require('make-runnable');
