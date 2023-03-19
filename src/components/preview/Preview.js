import { useEffect, useState } from "react";
import "./Preview.css";
import {ReactComponent as Spinner} from "../../img/spinner.svg"

function findDominant(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.addEventListener("load", function() {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = this.width;
      canvas.height = this.height;
      ctx.drawImage(this, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let r = 0,
          g = 0,
          b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      const pixels = data.length / 4;
      const hex = ((r / pixels) << 16 | (g / pixels) << 8 | b / pixels).toString(16);
      resolve(`#${hex.padStart(6, "0")}`);
    });
    img.addEventListener("error", function() {
      reject(new Error(`Failed to load image from ${url}`));
    });
  });
}

function Preview(props) {
  const [squares, setSquares] = useState([]);
  const [loading, setLoading] = useState(false)

const newCanvas = () => {
  setLoading(true)
  const canvas = document.createElement('canvas');

  const width = 4000 / (props.cols > props.rows ? props.cols : props.rows);
  canvas.width = width * props.cols;
  canvas.height = width * props.rows;

  const ctx = canvas.getContext('2d');

  const images = props.albums.map((album) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        findDominant(album).then((dominantColor) => {
          resolve({ img, dominantColor });
        }).catch(() => {
          resolve({ img, dominantColor: "#000000" }); // default to black if dominant color cannot be found
        });
      };
      img.onerror = () => {
        resolve({ img, dominantColor: "#000000" }); // default to black if image fails to load
      };
      img.crossOrigin = "anonymous";
      img.src = album;
    });
  });

  Promise.all(images).then((results) => {
    const sortedResults = results.sort((a, b) => {
      const aBrightness = calculateAverageBrightness(a.img, width);
      const bBrightness = calculateAverageBrightness(b.img, width);
      return bBrightness - aBrightness;
    });
    let x = 0;
    let y = 0;
    sortedResults.forEach(({ img }, i) => {
      ctx.drawImage(img, x, y, width, width);
      x += width;
      if ((i + 1) % props.cols === 0) {
        x = 0;
        y += width;
      }
    });

    const link = document.createElement('a');
    link.download = 'canvas.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    setLoading(false)
  }).catch((error) => {
    console.error(error);
    setLoading(false)
  });
};

function calculateAverageBrightness(img, width) {
const canvas = document.createElement('canvas');
canvas.width = width;
canvas.height = width;

const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0, width, width);

const imageData = ctx.getImageData(0, 0, width, width).data;
let totalBrightness = 0;

for (let i = 0; i < imageData.length; i += 4) {
  const r = imageData[i];
  const g = imageData[i + 1];
  const b = imageData[i + 2];
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  totalBrightness += brightness;
}

return totalBrightness / (width * width);
}


  useEffect(() => {
    setSquares([]);
    let rows = props.rows;
    let cols = props.cols;

    if (rows * cols === 0) {
      return;
    }

    let newSquares = [];
    for (let i = 0; i < rows * cols; i++) {
      let styles = {
        width: (60 / (cols > rows ? cols : rows)) + "vw",
        height: (60 / (cols > rows ? cols : rows)) + "vw",
        backgroundImage: `url(${props.albums.length > 0 ? props.albums[i] : ""})`
      }
      let newSquare = <div key={i} onClick={() => {findDominant(props.albums[i]).then(res => console.log(res))}} className="square" style={styles}></div>;
      newSquares.push(newSquare);
    }
    setSquares(newSquares);
  }, [props.rows, props.cols, props.albums]);

  return (
    <section className="preview-section" onClick={newCanvas}>
      <div className="preview-header">Will look like this:</div>
      <div className="preview-grid" style={{ gridTemplateRows: `repeat(${props.rows}, 1fr)` }}>
        {squares}
      </div>
      {loading ? <Spinner/> : null}
      <div className="preview-header">Tap at the collage to create and download a collagified version</div>

    </section>
    
  );
}

export default Preview;



// second variant
// function findDominant(imageUrl) {
//   return new Promise((resolve, reject) => {
//     // Load the image from the given URL
//     let img = new Image();
//     img.crossOrigin = "anonymous"; // Set the crossOrigin attribute to "anonymous"
//     img.src = imageUrl;

//     // Wait for the image to load before processing it
//     img.onload = function() {
//       // Create a canvas element and draw the image on it
//       let canvas = document.createElement("canvas");
//       canvas.width = img.width;
//       canvas.height = img.height;
//       let ctx = canvas.getContext("2d");
//       ctx.drawImage(img, 0, 0);

//       // Get the image data from the canvas
//       let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//       let pixels = imageData.data;

//       // Calculate the average RGB values of all the pixels
//       let totalR = 0;
//       let totalG = 0;
//       let totalB = 0;
//       for (let i = 0; i < pixels.length; i += 4) {
//         totalR += pixels[i];
//         totalG += pixels[i + 1];
//         totalB += pixels[i + 2];
//       }
//       let avgR = Math.round(totalR / (pixels.length / 4));
//       let avgG = Math.round(totalG / (pixels.length / 4));
//       let avgB = Math.round(totalB / (pixels.length / 4));

//       // Convert the average RGB values to hex format
//       let avgColor = rgbToHex(avgR, avgG, avgB);

//       // Resolve with the average color as a hex value
//       resolve(avgColor);
//     };

//     // Reject the promise if the image fails to load
//     img.onerror = function() {
//       reject(new Error("Failed to load image from URL"));
//     };
//   });

//   // Utility function to convert RGB to hex
//   function rgbToHex(r, g, b) {
//     let hex = "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
//     return hex;
//   }

//   // Utility function to convert a component to a two-digit hex value
//   function componentToHex(c) {
//     let hex = c.toString(16);
//     return hex.length == 1 ? "0" + hex : hex;
//   }
// }


//nice

// const newCanvas = () => {
//   setLoading(true)
//   const canvas = document.createElement('canvas');

//   const width = 4000 / (props.cols > props.rows ? props.cols : props.rows);
//   canvas.width = width * props.cols;
//   canvas.height = width * props.rows;

//   const ctx = canvas.getContext('2d');

//   const images = props.albums.map((album) => {
//     return new Promise((resolve, reject) => {
//       const img = new Image();
//       img.onload = () => {
//         findDominant(album).then((dominantColor) => {
//           resolve({ img, dominantColor });
//         }).catch(() => {
//           resolve({ img, dominantColor: "#000000" }); // default to black if dominant color cannot be found
//         });
//       };
//       img.onerror = () => {
//         resolve({ img, dominantColor: "#000000" }); // default to black if image fails to load
//       };
//       img.crossOrigin = "anonymous";
//       img.src = album;
//     });
//   });

//   Promise.all(images).then((results) => {
//     const sortedResults = results.sort((a, b) => {
//       const aBrightness = calculateAverageBrightness(a.img, width);
//       const bBrightness = calculateAverageBrightness(b.img, width);
//       return bBrightness - aBrightness;
//     });
//     let x = 0;
//     let y = 0;
//     sortedResults.forEach(({ img }, i) => {
//       ctx.drawImage(img, x, y, width, width);
//       x += width;
//       if ((i + 1) % props.cols === 0) {
//         x = 0;
//         y += width;
//       }
//     });

//     const link = document.createElement('a');
//     link.download = 'canvas.png';
//     link.href = canvas.toDataURL('image/png');
//     link.click();
//     setLoading(false)
//   }).catch((error) => {
//     console.error(error);
//     setLoading(false)
//   });
// };

// function calculateAverageBrightness(img, width) {
// const canvas = document.createElement('canvas');
// canvas.width = width;
// canvas.height = width;

// const ctx = canvas.getContext('2d');
// ctx.drawImage(img, 0, 0, width, width);

// const imageData = ctx.getImageData(0, 0, width, width).data;
// let totalBrightness = 0;

// for (let i = 0; i < imageData.length; i += 4) {
//   const r = imageData[i];
//   const g = imageData[i + 1];
//   const b = imageData[i + 2];
//   const brightness = (r * 299 + g * 587 + b * 114) / 1000;
//   totalBrightness += brightness;
// }

// return totalBrightness / (width * width);
// }




//variant with good colors

// import { useEffect, useState } from "react";
// import "./Preview.css";
// import {ReactComponent as Spinner} from "../../img/spinner.svg"


// function rgbToHsl(r, g, b) {
//   r /= 255;
//   g /= 255;
//   b /= 255;
//   const max = Math.max(r, g, b);
//   const min = Math.min(r, g, b);
//   const d = max - min;
//   let h;
//   if (d === 0) {
//     h = 0;
//   } else if (max === r) {
//     h = ((g - b) / d) % 6;
//   } else if (max === g) {
//     h = (b - r) / d + 2;
//   } else {
//     h = (r - g) / d + 4;
//   }
//   h = Math.round(h * 60);
//   if (h < 0) {
//     h += 360;
//   }
//   const l = (max + min) / 2;
//   const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
//   return [h, s * 100, l * 100];
// }

// function sortColors(colors) {
//   const anchorColors = [
//     { color: "#FFFFFF", position: 0 },  // white
//     { color: "#0000FF", position: 1 / 6 },  // blue
//     { color: "#800080", position: 2 / 6 },  // purple
//     { color: "#FF0000", position: 3 / 6 },  // red
//     { color: "#FFFF00", position: 4 / 6 },  // yellow
//     { color: "#008000", position: 5 / 6 },  // green
//     { color: "#000000", position: 1 }   // black
//   ];

//   const hslColors = colors.map(color => {
//     const [r, g, b] = color.slice(1).match(/.{2}/g).map(hex => parseInt(hex, 16));
//     const [h, s, l] = rgbToHsl(r, g, b);
//     return { color, h, s, l };
//   });

//   hslColors.sort((a, b) => {
//     const aPosition = getGradientPosition(a.h, a.s, a.l, anchorColors);
//     const bPosition = getGradientPosition(b.h, b.s, b.l, anchorColors);
//     return aPosition - bPosition;
//   });

//   return hslColors.map(({ color }) => color);
// }

// function getGradientPosition(h, s, l, anchorColors) {
//   let position = 0;
//   let minDistance = Infinity;

//   anchorColors.forEach(({ color, position: anchorPosition }) => {
//     const [r, g, b] = color.slice(1).match(/.{2}/g).map(hex => parseInt(hex, 16));
//     const [h2, s2, l2] = rgbToHsl(r, g, b);
//     const distance = compareHsl(h, s, l, h2, s2, l2);
//     if (distance < minDistance) {
//       minDistance = distance;
//       position = anchorPosition;
//     }
//   });

//   return position;
// }

// function compareHsl(h1, s1, l1, h2, s2, l2) {
//   const dh = Math.abs(h1 - h2);
//   const ds = Math.abs(s1 - s2);
//   const dl = Math.abs(l1 - l2);
//   return dh + ds + dl;
// }

// function findDominant(url) {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.crossOrigin = "Anonymous";
//     img.src = url;
//     img.addEventListener("load", function() {
//       const canvas = document.createElement("canvas");
//       const ctx = canvas.getContext("2d");
//       canvas.width = this.width;
//       canvas.height = this.height;
//       ctx.drawImage(this, 0, 0);
//       const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//       const data = imageData.data;
//       let r = 0,
//           g = 0,
//           b = 0;
//       for (let i = 0; i < data.length; i += 4) {
//         r += data[i];
//         g += data[i + 1];
//         b += data[i + 2];
//       }
//       const pixels = data.length / 4;
//       const hex = ((r / pixels) << 16 | (g / pixels) << 8 | b / pixels).toString(16);
//       resolve(`#${hex.padStart(6, "0")}`);
//     });
//     img.addEventListener("error", function() {
//       reject(new Error(`Failed to load image from ${url}`));
//     });
//   });
// }

// function Preview(props) {
//   const [squares, setSquares] = useState([]);
//   const [loading, setLoading] = useState(false)

//   const newCanvas = () => {
//     setLoading(true)
//     const canvas = document.createElement('canvas');
  
//     const width = 4000 / (props.cols > props.rows ? props.cols : props.rows);
//     canvas.width = width * props.cols;
//     canvas.height = width * props.rows;
  
//     const ctx = canvas.getContext('2d');
  
//     const images = props.albums.map((album) => {
//       return new Promise((resolve, reject) => {
//         const img = new Image();
//         img.onload = () => {
//           findDominant(album).then((dominantColor) => {
//             resolve({ img, dominantColor });
//           }).catch(() => {
//             resolve({ img, dominantColor: "#000000" }); // default to black if dominant color cannot be found
//           });
//         };
//         img.onerror = () => {
//           resolve({ img, dominantColor: "#000000" }); // default to black if image fails to load
//         };
//         img.crossOrigin = "anonymous";
//         img.src = album;
//       });
//     });
  
//     Promise.all(images).then((results) => {
//       // Sort images by brightness first
//       const sortedResults = results.sort((a, b) => {
//         const aBrightness = calculateAverageBrightness(a.img, width);
//         const bBrightness = calculateAverageBrightness(b.img, width);
//         return bBrightness - aBrightness;
//       });
  
//       // Split sorted images into bright and dark arrays
//       const midIndex = Math.floor(sortedResults.length / 2);
//       const brightImages = sortedResults.slice(0, midIndex);
//       const darkImages = sortedResults.slice(midIndex);
  
//       // Sort bright images by gradient position of dominant color
//       const brightColors = brightImages.map(image => image.dominantColor);
//       const sortedBrightColors = sortColors(brightColors);
//       const sortedBrightImages = [];
//       for (let i = 0; i < sortedBrightColors.length; i++) {
//         const index = brightColors.indexOf(sortedBrightColors[i]);
//         if (index !== -1) {
//           sortedBrightImages.push(brightImages[index]);
//         }
//       }
  
//       // Sort dark images by gradient position of dominant color
//       const darkColors = darkImages.map(image => image.dominantColor);
//       const sortedDarkColors = sortColors(darkColors);
//       const sortedDarkImages = [];
//       for (let i = 0; i < sortedDarkColors.length; i++) {
//         const index = darkColors.indexOf(sortedDarkColors[i]);
//         if (index !== -1) {
//           sortedDarkImages.push(darkImages[index]);
//         }
//       }
  
//       // Combine sorted bright and dark images
//       const sortedResultsWithGradient = [...sortedBrightImages, ...sortedDarkImages];
  
//       let x = 0;
//       let y = 0;
//       sortedResultsWithGradient.forEach(({ img }, i) => {
//         ctx.drawImage(img, x, y, width, width);
//         x += width;
//         if ((i + 1) % props.cols === 0) {
//           x = 0;
//           y += width;
//         }
//       });
  
//       const link = document.createElement('a');
//       link.download = 'canvas.png';
//       link.href = canvas.toDataURL('image/png');
//       link.click();
//       setLoading(false)
//     }).catch((error) => {
//       console.error(error);
//       setLoading(false)
//     });
//   };

// function calculateAverageBrightness(img, width) {
// const canvas = document.createElement('canvas');
// canvas.width = width;
// canvas.height = width;

// const ctx = canvas.getContext('2d');
// ctx.drawImage(img, 0, 0, width, width);

// const imageData = ctx.getImageData(0, 0, width, width).data;
// let totalBrightness = 0;

// for (let i = 0; i < imageData.length; i += 4) {
//   const r = imageData[i];
//   const g = imageData[i + 1];
//   const b = imageData[i + 2];
//   const brightness = (r * 299 + g * 587 + b * 114) / 1000;
//   totalBrightness += brightness;
// }

// return totalBrightness / (width * width);
// }
//   function calculateAverageBrightness(img, width) {
//   const canvas = document.createElement('canvas');
//   canvas.width = width;
//   canvas.height = width;

//   const ctx = canvas.getContext('2d');
//   ctx.drawImage(img, 0, 0, width, width);

//   const imageData = ctx.getImageData(0, 0, width, width).data;
//   let totalBrightness = 0;

//   for (let i = 0; i < imageData.length; i += 4) {
//     const r = imageData[i];
//     const g = imageData[i + 1];
//     const b = imageData[i + 2];
//     const brightness = (r * 299 + g * 587 + b * 114) / 1000;
//     totalBrightness += brightness;
//   }

//   return totalBrightness / (width * width);
// }
  


//   useEffect(() => {
//     setSquares([]);
//     let rows = props.rows;
//     let cols = props.cols;

//     if (rows * cols === 0) {
//       return;
//     }

//     let newSquares = [];
//     for (let i = 0; i < rows * cols; i++) {
//       let styles = {
//         width: (60 / (cols > rows ? cols : rows)) + "vw",
//         height: (60 / (cols > rows ? cols : rows)) + "vw",
//         backgroundImage: `url(${props.albums.length > 0 ? props.albums[i] : ""})`
//       }
//       let newSquare = <div key={i} onClick={() => {findDominant(props.albums[i]).then(res => console.log(res))}} className="square" style={styles}></div>;
//       newSquares.push(newSquare);
//     }
//     setSquares(newSquares);
//   }, [props.rows, props.cols, props.albums]);

//   return (
//     <section className="preview-section" onClick={newCanvas}>
//       <div className="preview-header">Will look like this:</div>
//       <div className="preview-grid" style={{ gridTemplateRows: `repeat(${props.rows}, 1fr)` }}>
//         {squares}
//       </div>
//       {loading ? <Spinner/> : null}
//       <div className="preview-header">Tap at the collage to create and download a collagified version</div>

//     </section>
    
//   );
// }

// export default Preview;
