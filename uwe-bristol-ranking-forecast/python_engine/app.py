from flask import Flask, jsonify, request
from model import train_and_predict_rankings

app = Flask(__name__)

@app.route('/predict_rankings', methods=['POST'])
def predict_rankings():
    data = request.json.get('historical_data', [])
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    predictions = train_and_predict_rankings(data)
    return jsonify({
        "predictions": [{"year": y, "rank": int(round(r))} for y, r in predictions]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
