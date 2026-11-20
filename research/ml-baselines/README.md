# Supervised baselines (research only)

Offline study for the research paper. Nothing in this folder is used by the platform.

It trains logistic regression, a linear SVM, and XGBoost on the 400 labeled test complaints in `src/eval` and compares them with the rules, the LLM, and the hybrid from the evaluation run (`run3.json`, exported from `/lab/evaluation`).

- **Grouped CV:** stratified 5-fold cross-validation, repeated five times. A Roman Urdu complaint and the English complaint it paraphrases always land in the same fold (`groups.py`).
- **Plain CV:** the same without grouping, for comparison.
- **Small history:** trained on the first 120 complaints, tested on the other 280.
- **Learning curve:** SVM category accuracy by training size.

```bash
pip install -r requirements.txt
python3 baselines.py
```

The results are written to `results.json`. A full run takes about 15 minutes on two CPU cores.

`transformer_baselines.py` fine-tunes DistilBERT (`distilbert-base-uncased`) for category and priority with the same grouped split and small-history split. It also scores Sentence-BERT (`all-MiniLM-L6-v2`) on the 150 title pairs, with the threshold chosen on the first 50 pairs and tested on the other 100. The models download from Hugging Face on first run. It takes about an hour on two CPU cores and writes `transformer_results.json`.

```bash
python3 transformer_baselines.py
```
