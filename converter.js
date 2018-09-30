module.exports = {
  convertCsvToJson: function(){
    console.log('Hello World');

    const colorsobj = require('./csv/colors');
    let colors = colorsobj.colors;

    const struct = {

    };

    for (let i = 0; i < colors.length; i++){
      let color = colors[i];
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
  }
};
require('make-runnable');
