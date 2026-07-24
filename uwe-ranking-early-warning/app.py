from flask import Flask, request, jsonify
import joblib, json
import pandas as pd

app = Flask(__name__)
lgbm = joblib.load('models/model_lgbm_311.pkl')
clf  = joblib.load('models/classifier_311.pkl')
FEATURES = json.load(open('models/features.json'))

@app.route('/')
def home():
    return open('index.html').read()

@app.route('/predict', methods=['POST'])
def predict():
    d = request.json
    sat=d['sat']; ratio=d['ratio']; career=d['career']
    cont=d['cont']; tariff=d['tariff']; rq=d['rq']
    lag=d['lag']; sat_lag=d['sat_lag']
    ratio_lag=d['ratio_lag']; career_lag=d['career_lag']; avg=d['avg']
    row={
        'entry_tariff':tariff,'satisfaction':sat,'staff_ratio':ratio,
        'career_prospects':career,'continuation':cont,'research_quality':rq,
        'rank_lag1':lag,'satisfaction_lag1':sat_lag,'staff_ratio_lag1':ratio_lag,
        'career_lag1':career_lag,'rank_change':(sat-sat_lag)*-3,
        'satisfaction_change':sat-sat_lag,'staff_ratio_change':ratio-ratio_lag,
        'career_change':career-career_lag,'rank_3yr_avg':avg,
        'satisfaction_3yr_avg':(sat+sat_lag)/2
    }
    X = pd.DataFrame([row])[FEATURES]
    rank = float(lgbm.predict(X)[0])
    proba = clf.predict_proba(X)[0]
    classes = list(clf.classes_)
    prob = float(proba[classes.index('at_risk')] if 'at_risk' in classes else 0.0)
    at_risk = bool(prob >= 0.25)
    change = rank - lag
    direction = "worse by " + str(round(abs(change))) if change > 0 else "better by " + str(round(abs(change)))
    status = "AT RISK - " + str(round(prob*100)) + "% probability of decline" if at_risk else "STABLE - " + str(round(prob*100)) + "% at-risk probability"
    return jsonify({'rank': str(round(rank)) + " (" + direction + " places)", 'prob': str(round(prob*100,1)) + "%", 'status': status, 'at_risk': at_risk})

if __name__ == '__main__':
    print("Running at http://127.0.0.1:8080")
    app.run(host='0.0.0.0', port=8080, debug=False)