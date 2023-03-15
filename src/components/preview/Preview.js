import { useEffect, useState } from "react";
import "./Preview.css";

function findDominant(imageUrl) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = function() {
      let canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      let ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let pixels = imageData.data;

      // Convert RGB to HSL color space
      let hslColors = [];
      for (let i = 0; i < pixels.length; i += 4) {
        let r = pixels[i];
        let g = pixels[i+1];
        let b = pixels[i+2];
        let hsl = rgbToHsl(r, g, b);
        hslColors.push(hsl);
      }

      // Cluster similar colors using k-means algorithm
      let clusters = kmeans(hslColors, 5);

      // Compute the weight of each color in each cluster
      let weights = [];
      for (let i = 0; i < clusters.length; i++) {
        let cluster = clusters[i];
        let weight = [];
        for (let j = 0; j < cluster.length; j++) {
          let color = cluster[j];
          // Weight each color by its saturation and lightness
          let saturationWeight = color[1];
          let lightnessWeight = 1 - Math.abs(0.5 - color[2]);
          let totalWeight = saturationWeight * lightnessWeight;
          weight.push(totalWeight);
        }
        weights.push(weight);
      }

      // Find the dominant color in each cluster based on the weighted count
      let dominantColors = [];
      for (let i = 0; i < clusters.length; i++) {
        let cluster = clusters[i];
        let weight = weights[i];
        let colorCounts = {};
        for (let j = 0; j < cluster.length; j++) {
          let color = hslToHex(cluster[j]);
          if (color in colorCounts) {
            colorCounts[color] += weight[j];
          } else {
            colorCounts[color] = weight[j];
          }
        }
        let dominantColor = null;
        let maxCount = 0;
        for (let color in colorCounts) {
          if (colorCounts[color] > maxCount) {
            dominantColor = color;
            maxCount = colorCounts[color];
          }
        }
        dominantColors.push(dominantColor);
      }

      // Resolve with the dominant colors as an array of hex values
      resolve(dominantColors);
    };

    img.onerror = function() {
      reject(new Error("Failed to load image from URL"));
    };
  });

  // Converts RGB color values to HSL color space
function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
   b /= 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h, s, l];
}

// Converts HSL color values to hexadecimal color code
function hslToHex(hsl) {
  let h = hsl[0], s = hsl[1], l = hsl[2];
  let r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    let hue2rgb = function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  let toHex = function(x) {
    let hex = Math.round(x * 255).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  return "#" + toHex(r) + toHex(g) + toHex(b);
}

}



function kmeans(points, k) {
  // Initialize k random centroids
  let centroids = [];
  for (let i = 0; i < k; i++) {
    let index = Math.floor(Math.random() * points.length);
    centroids.push(points[index]);
  }

  // Loop until convergence
  while (true) {
    // Assign points to nearest centroid
    let clusters = [];
    for (let i = 0; i < k; i++) {
      clusters.push([]);
    }
    for (let i = 0; i < points.length; i++) {
      let point = points[i];
      let nearestCentroid = null;
      let minDistance = Number.MAX_VALUE;
      for (let j = 0; j < centroids.length; j++) {
        let centroid = centroids[j];
        let distance = euclideanDistance(point, centroid);
        if (distance < minDistance) {
          nearestCentroid = j;
          minDistance = distance;
        }
      }
      clusters[nearestCentroid].push(point);
    }

    // Update centroids
    let newCentroids = [];
    for (let i = 0; i < k; i++) {
      let cluster = clusters[i];
      if (cluster.length === 0) {
        // If a cluster is empty, choose a random point as its centroid
        let index = Math.floor(Math.random() * points.length);
        newCentroids.push(points[index]);
      } else {
        let sum = cluster.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]);
        let centroid = [sum[0] / cluster.length, sum[1] / cluster.length, sum[2] / cluster.length];
        newCentroids.push(centroid);
      }
    }

    // Check for convergence
    let converged = true;
    for (let i = 0; i < k; i++) {
      if (!arraysEqual(newCentroids[i], centroids[i])) {
        converged = false;
        break;
      }
    }
    if (converged) {
      return clusters;
    }

    centroids = newCentroids;
  }
}

function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

function arraysEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}


function Preview(props) {
  const [squares, setSquares] = useState([]);

  const newCanvas = () => {
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
        const aBrightness = calculateBrightness(a.dominantColor);
        const bBrightness = calculateBrightness(b.dominantColor);
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
    }).catch((error) => {
      console.error(error);
    });
  };
  
  // utility function to calculate the brightness of a color
  function calculateBrightness(color) {
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
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
        width: (750 / (cols > rows ? cols : rows)) + "px",
        height: (750 / (cols > rows ? cols : rows)) + "px",
        backgroundImage: `url(${props.albums.length > 0 ? props.albums[i] : ""})`
      }
      let newSquare = <div key={i} className="square" style={styles}></div>;
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
    </section>
    
  );
}

export default Preview;


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

//       // Convert RGB values to HSL values
//       let hslPixels = [];
//       for (let i = 0; i < pixels.length; i += 4) {
//         let r = pixels[i];
//         let g = pixels[i+1];
//         let b = pixels[i+2];
//         let hsl = rgbToHsl(r, g, b);
//         hslPixels.push(hsl);
//       }

//       // Use k-means clustering to group similar colors together
//       let clusters = kMeansClustering(hslPixels);

//       // Compute the weighted counts of each cluster
//       let clusterCounts = {};
//       for (let i = 0; i < clusters.length; i++) {
//         let cluster = clusters[i];
//         let weight = cluster.saturation * cluster.lightness;
//         let count = cluster.pixels.length;
//         for (let j = 0; j < count; j++) {
//           let color = hslToHex(cluster.pixels[j]);
//           if (color in clusterCounts) {
//             clusterCounts[color] += weight;
//           } else {
//             clusterCounts[color] = weight;
//           }
//         }
//       }

//       // Find the color with the highest weighted count
//       let dominantColor = null;
//       let maxCount = 0;
//       for (let color in clusterCounts) {
//         if (clusterCounts[color] > maxCount) {
//           dominantColor = color;
//           maxCount = clusterCounts[color];
//         }
//       }

//       // Resolve with the dominant color as a hex value
//       resolve(dominantColor);
//     };

//     // Reject the promise if the image fails to load
//     img.onerror = function() {
//       reject(new Error("Failed to load image from URL"));
//     };
//   });
// }
