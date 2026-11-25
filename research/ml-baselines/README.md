# Supervised baselines and statistics (research only)

Offline study for the research paper. Nothing in this folder is used by the platform.

All scripts read the labeled test set in `src/eval` (400 complaints and 150 title pairs). They also read the evaluation run exported from `/lab/evaluation`: `run3.json` (Nov. 20, 2026), plus `run2.json` (Nov. 19, 2026) for the repeatability check.

| Script | What it does | Writes |
|---|---|---|
| `baselines.py` | Logistic regression, linear SVM, and XGBoost with fixed settings. Runs grouped and plain 5-fold CV (five repeats), the small-history split (train on the first 120, test on the other 280), and an SVM learning curve. | `results.json` |
| `supervised_tuned.py` | The same models tuned by nested, grouped CV: three repeats, or one for XGBoost. | `tuned_results.json` |
| `transformer_baselines.py` | DistilBERT fine-tuned for category and priority, and Sentence-BERT on the title pairs. | `transformer_results.json` |
| `local_lowlabel.py` | SetFit with 8 examples per class, and zero-shot NLI, on the 280 held-out complaints. | `lowlabel_results.json` |
| `pair_encoders.py` | TF-IDF, English Sentence-BERT, multilingual MiniLM, and LaBSE similarity for the title pairs. | `pair_scores.json` |
| `stats.py` | Wilson and Clopper–Pearson intervals, macro-F1, quadratic-weighted kappa, exact McNemar with Holm correction, critical and safety precision and recall, the ablation with a simulated LLM outage, and duplicate metrics (accuracy, MCC, Fisher test, ROC-AUC, PR-AUC). | `stats_results.json` |
| `local_llm.py` | A local open-weight LLM (Qwen2.5-1.5B-Instruct on a CPU) with the platform's instruction, on the 280 held-out complaints. | `local_llm_results.json` |
| `stress_variants.py` | One-letter typo, Roman Urdu, and mixed-case variants of the critical and safety complaints. | `stress_variants.json` |
| `gemini_extra.ts` | Gemini runs with the platform's code and your `.env` key: the LLM on the stress variants, title embeddings for the retrieval pool, and few-shot prompting (three runs). Run from the repository root with `npx tsx --conditions=react-server --env-file=.env.local research/ml-baselines/gemini_extra.ts [stress\|pool\|fewshot]`. | `gemini_stress.json`, `gemini_pool_sims.json`, `gemini_fewshot.json` |
| `pool_retrieval.py` | Duplicate retrieval in a pool of the 400 complaints over 60 simulated days, each Roman Urdu paraphrase treated as a later report of its English original. | `pool.json`, `retrieval_results.json` |
| `llm_runs.ts` | Repeated LLM runs on the test complaints without the browser, in the export format of `/lab/evaluation` (`IDS` limits a run to given complaints). Writes into `runs/`. | `runs/*.json` |
| `compose_runs.py` | Five LLM answers per development complaint, from `run3.json`, `run2.json`, and `runs/`. | `dev_runs.json` |
| `extra_stats.py` | Five LLM runs on the 120 development complaints, the stress test, few-shot, and the local LLM. | `extra_results.json` |
| `pii_cases.py` | Sentences with planted identifiers in Pakistani formats. Run the platform's `redact()` over them to get `pii_redacted.json`. | `pii_cases.json` |
| `safety_stress_cases.py` | Upper-case, typo, and Roman Urdu variants of critical complaints. Run the platform's `hasEmergency()` over them to get `safety_stress_results.json`. | `safety_stress_cases.json` |

`groups.py` links each Roman Urdu complaint to the English complaint it paraphrases, so cross-validation keeps the two in the same fold.

```bash
pip install -r requirements.txt
python3 baselines.py
python3 supervised_tuned.py
python3 transformer_baselines.py
python3 local_lowlabel.py
python3 pair_encoders.py
python3 stats.py
python3 local_llm.py
python3 stress_variants.py
python3 pool_retrieval.py
python3 compose_runs.py
python3 extra_stats.py
```

The transformer and encoder models download from Hugging Face on first run. Everything runs on a CPU. The slowest steps are DistilBERT, which takes about an hour on two cores, and the XGBoost search.

`gemini_extra.ts pool` keeps the raw vectors in `gemini_pool_vectors.tmp.json` while it runs; delete that file afterwards, it is not needed.
