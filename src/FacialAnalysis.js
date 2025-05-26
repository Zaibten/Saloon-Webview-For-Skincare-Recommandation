import React, { useState } from 'react';
import axios from 'axios';
import './FacialAnalysis.css';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Card from 'react-bootstrap/Card';
import Resizer from 'react-image-file-resizer';

function FacialAnalysis() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false); // New loading state


const [aestheticTips, setAestheticTips] = useState([]);  // holds array of tips
const [tipIndex, setTipIndex] = useState(0);
const [showTips, setShowTips] = useState(false);


const loadNextTip = async () => {
  if (aestheticTips.length === 0) {
    try {
      const response = await fetch('/aesthetic_recommendations.json');
      const data = await response.json();
      setAestheticTips(data);
      setTipIndex(1);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  } else {
    const nextIndex = tipIndex % aestheticTips.length;
    setTipIndex(nextIndex + 1);
  }
};



  // Resize the image while maintaining the aspect ratio
  const resizeImage = (file, maxDimension) => {
    return new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        maxDimension, // Max width or height (whichever is larger)
        maxDimension, // Max height or width (aspect ratio is maintained)
        'JPEG',       // Output format
        70,           // Quality percentage
        0,            // Rotation angle
        (uri) => {
          resolve(uri);  // Return the resized image as a Blob
        },
        'blob'  // Return format: blob (can also be base64)
      );
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const image = new Image();
    image.src = URL.createObjectURL(file);

    // Wait for the image to load to get its dimensions
    image.onload = async () => {
      const { width, height } = image;

      let resizedFile = file;

      // Resize if the image dimensions exceed 1000px
      if (width > 1000 || height > 1000) {
        resizedFile = await resizeImage(file, 1000);
      }

      setSelectedFile(resizedFile);
      const imageURL = URL.createObjectURL(resizedFile);
      setPreviewURL(imageURL);
    };
  };

  const handlePredict = () => {
    if (!selectedFile) {
      console.error('No image selected.');
      return;
    }

    // Set loading to true when the request starts
    setLoading(true);

    const formData = new FormData();
    formData.append('image', selectedFile);

    axios
      .post('https://sayan.work.gd/predict', formData, {
      // .post('http://localhost:5000/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => {
        const predictions = response.data.predictions;
        const recommendations = response.data.recommendations;
    
        const sortedPredictions = Object.entries(predictions).sort(
          (a, b) => b[1] - a[1]
        );
    
        // Filter predictions with a probability greater than 0.10 (10%)
        const filteredPredictions = sortedPredictions.filter(
          ([_, probability]) => probability > 0.10
        );
    
        // Convert the filtered predictions back to an object
        const filteredPredictionsObj = Object.fromEntries(filteredPredictions);
    
        setPredictions({ predictions: filteredPredictionsObj, recommendations });
    
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error uploading image:', error);
        setPredictions(null);

        // Set loading to false even if there is an error
        setLoading(false);
      });
  };

  // Add a new ref for the selfie input
  const selfieInputRef = React.createRef();

  // Function to trigger the hidden selfie input
  const handleSelfieClick = () => {
    selfieInputRef.current.click(); // Simulate a click on the hidden input
  };

  // Add another handle function for the selfie input change
  const handleSelfieFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const image = new Image();
    image.src = URL.createObjectURL(file);

    image.onload = async () => {
      const { width, height } = image;

      let resizedFile = file;

      // Resize if the image dimensions exceed 1000px
      if (width > 1000 || height > 1000) {
        resizedFile = await resizeImage(file, 1000);
      }

      setSelectedFile(resizedFile);
      const imageURL = URL.createObjectURL(resizedFile);
      setPreviewURL(imageURL);
    };
  };

  return (
    <div className="FacialAnalysis d-flex justify-content-center align-items-center">
      <Card style={{ width: '100%' }} className="analysis-card p-4">
   
        <Card.Body className="text-center">
          {previewURL && (
            <img src={previewURL} alt="Preview" className="preview-image img-thumbnail mb-4" />
          )}

          <div className="mb-3">
            {/* Bootstrap custom file input */}
            <div className="input-group mb-3">
              <div className="custom-file">
                <input 
                  type="file" 
                  className="custom-file-input" 
                  id="inputGroupFile01" 
                  accept="image/*" // Allows choosing from gallery or taking a picture
                  onChange={handleFileChange}
                />
                <label className="custom-file-label" htmlFor="inputGroupFile01">
                  Select Face Picture
                </label>
              </div>
            </div>
          </div>

          {/* Add Click Selfie button for mobile devices */}
          <div className="mb-3 d-md-none">
            {/* Hidden file input for selfies with capture="user" */}
            <input 
              ref={selfieInputRef} 
              type="file" 
              accept="image/*" 
              capture="user" // Opens camera for selfie 
              className="d-none"  // Hidden input
              onChange={handleSelfieFileChange} 
            />
            
            {/* Button that triggers the hidden input */}
            <button 
              className="btn btn-primary btn-block" 
              onClick={handleSelfieClick} 
            >
              Click Selfie
            </button>
          </div>

          <div>
            <button 
              onClick={handlePredict} 
              className="btn btn-success btn-block"
              disabled={loading} // Disable the button while loading
            >
              {loading ? 'Predicting...' : 'Predict'}
            </button>
          </div>
          
          {predictions && (
            <div className="predictions table-responsive mt-4">

              <h3>Face Conditions:</h3>
              <table className="table table-bordered table-hover">
                <thead className="thead-dark">
                  <tr>
                    <th>Facial Condition</th>
                    <th>Probability</th>
                    <th>Recommendations</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(predictions.predictions).map(
                    ([condition, probability]) => (
                      <tr key={condition}>
                        <td>{condition}</td>
                        <td>
                          <ProgressBar
                            now={probability * 100}
                            label={`${(probability * 100).toFixed(2)}%`}
                          />
                        </td>
                        <td>
                          {predictions.recommendations[condition].length > 0 ? (
                            <ul className="recommendations-list">
                              {predictions.recommendations[condition].map((product) => (
                                <li key={product.product_name}>
                                  <a target="_blank" rel="noreferrer">
                                    <img
                                      src={product.product_image}
                                      alt={product.product_name}
                                      className="product-image"
                                    />
                                  </a>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span>No recommendation</span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>

<style>{`
  .btn-fullwidth-container {
    max-width: 400px;
    margin: 1.5rem auto;
  }
  .btn-fullwidth {
    width: 100%;
    padding: 14px 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, #0a9396, #005f73);
    border: none;
    border-radius: 30px;
    cursor: pointer;
    box-shadow: 0 8px 15px rgba(10, 147, 150, 0.4);
    transition: all 0.4s ease;
    user-select: none;
    display: block;
  }
  .btn-fullwidth:hover:enabled {
    background: linear-gradient(135deg, #005f73, #0a9396);
    box-shadow: 0 12px 20px rgba(10, 147, 150, 0.6);
    transform: translateY(-3px);
  }
  .btn-fullwidth:active:enabled {
    transform: translateY(-1px);
    box-shadow: 0 6px 10px rgba(10, 147, 150, 0.5);
  }
  .aesthetic-box {
    max-width: 800px;
    margin: 0 auto;
    animation: fadeInUp 0.5s ease forwards;
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  .product-table {
    width: 100%;
    margin-top: 12px;
    border-collapse: collapse;
    font-size: 0.95rem;
  }
  .product-table th,
  .product-table td {
    padding: 12px 16px;
    border: 1px solid #dee2e6;
    text-align: left;
  }
  .product-table th {
    background-color: #0a9396;
    color: white;
  }
  .product-table td .btn-buy {
    background-color: #005f73;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    color: white;
    text-decoration: none;
    transition: background-color 0.3s ease;
  }
  .product-table td .btn-buy:hover {
    background-color: #0a9396;
  }
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`}</style>

<div className="btn-fullwidth-container">
  <button
    className="btn-fullwidth"
    onClick={async () => {
      await loadNextTip();
      setShowTips(true);
    }}
    disabled={showTips}
  >
    Show Aesthetic Recommendations
  </button>
</div>

{showTips && (
  <div className="aesthetic-box mt-4 p-3 border rounded bg-light">
    {aestheticTips.slice(0, 3).map((tip, i) => (
      <div key={i} className="mb-4">
        <h4>{tip.title}</h4>
        <p>{tip.description}</p>
        <strong>Suggested Products:</strong>
        <table className="product-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product Name</th>
              {/* <th>Buy Link</th> */}
            </tr>
          </thead>
          <tbody>
            {tip.products.slice(0, 3).map(({ name, url }, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{name}</td>
                {/* <td>
                  <button
                    className="btn-buy"
                    onClick={() => window.open(url, "_blank")}
                    title="Buy Now"
                  >
                    Buy Now
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ))}
  </div>
)}




            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default FacialAnalysis;
