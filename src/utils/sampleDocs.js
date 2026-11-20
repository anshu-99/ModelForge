// Pre-loaded realistic sample unformatted documents to test all formatting modes instantly

export const SAMPLE_DOCUMENTS = [
  {
    id: 'phishing-detection-ieee',
    title: 'AI-Based Phishing Website Detection Using Machine Learning',
    category: 'Cybersecurity & AI (IEEE Conference Paper)',
    description: 'A complete IEEE research manuscript on stacked ensemble learning, SHAP explainability, and URL analysis by Shivam Kushwah & Vivek Saxena.',
    content: `AI-Based Phishing Website Detection Using Machine Learning
| Shivam Kushwah  Department of Computer Engineering  Poornima Institute of Engineering and Technology  Jaipur, Rajasthan, India  Registration No. PIET23CS151  2023pietcsshivam151@poornima.org   | Vivek Saxena  Assistant Professor, Department of Computer Engineering  Poornima Institute of Engineering and Technology  Jaipur, Rajasthan   India  vivek.saxena@poornima.org   |
ABSTRACT - Phishing websites are imitating trusted brands to steal credentials, payment details and personal data. What's more, they appear and disappear faster than static blocklists can follow. A stacked ensemble of Random Forest, XGBoost, LightGBM and CatBoost, combined by a logistic-regression meta-learner, creates a probability that's adjusted and checked with a threshold chosen to cap the false-positive rate, after correlation filtering and mutual-information selection; this model is a design study and hasn't been trained to completion. SHAP attributions are showing the user and the analyst which features drove each verdict, and a feedback loop retrains the model on validated cases. Classifiers built with machine learning can judge a page that has never been seen. Every performance figure is a projection worked out from ranges reported in the literature, and is meant as a target and as a plan for the ablation study. But still, published systems often report exactness on a single, balanced, randomly split dataset, which is saying little about how they behave against new attacks or at the very low false-positive rates that browsers are needing; this paper is suggesting an end-to-end framework that classifies a website as legitimate or phishing from forty attributes in three groups: lexical traits of the URL, host-based features such as domain age and certificate properties, and content features taken from the page's HTML, the standard web markup language.
Keywords, phishing detection, machine learning, ensemble learning, URL analysis, feature selection, class imbalance, explainable AI, cybersecurity
I. Introduction
Banking and shopping, especially regarding teaching, especially regarding government services now run on the web, so a convincing copy of a login page is one of the cheapest ways to commit fraud, in real-world scenarios; phishing is a form of social engineering in which an attacker is building a website that's imitating a trusted organization and persuades the visitor to hand over credentials, card numbers or one-time codes [1], broadly speaking. The attacker is needing no software vulnerability, only a believable page and a link; indeed, as, well, a link can travel by e-mail, SMS, a messaging application or an advertisement.
The classic defences are often blocklists and hand-written heuristics; indeed, a blocklist only knows what has already been reported. And many phishing sites are normally live for a short time, before they're listed or taken down, on the whole; indeed, look-alike areas are also registered by attackers, rotate hosts, and get free certificates, so that the padlock in the address bar no longer is separating honest sites from dishonest ones, to a significant degree. A benchmarking study of phishing detectors found retraining alone isn't enough to defeat new attacks, because attackers are changing what the detectors look at [1].
Machine learning is, in effect, replacing fixed rules with a classifier trained on labelled examples. Models built on URL, host and page-content features report accuracies above 97 % [2], [5], [6], and a classifier can judge a page that no blocklist has seen, in many respects. Three issues are, to a large extent, keeping these findings from carrying over to real use. To begin, evaluation: many studies use balanced datasets and random splits, so near-duplicate URLs from one campaign sit on both sides of the split, in actual application. And benchmarking has shown that class imbalance changes detector behaviour [1]. Moving on, the cost of a false alarm, including a browser loads far more honest pages than phishing pages, so a detector must work at very low false-positive rates, which is the regime in which transformer-based URL models are now checked [3]. And then, opacity - a verdict without a reason is hard for a user to trust. What's more, for an analyst to correct. As, well, detectors that lean on third-party lookups add latency [5].
The paper designs a framework that tackles these three obstacles together. The advancements are:
1) A feature chain that's turning a URL into the forty attributes in three groups (lexical, host-based and content-based), organised in three tiers so that the cheapest proof is available first and the costly page fetch is generally optional.
2) A stacked ensemble of Random Forest, XGBoost, LightGBM and CatBoost with a logistic-regression meta-learner, trained with class weighting, followed by isotonic calibration and a decision threshold chosen under a false-positive budget.
3) An evaluation protocol with domain-grouped and temporal splits and a zero-day recall metric, so that the findings can be tested against attacks the model hasn't seen, to a significant degree.
4) A deployment design, a browser extension backed by a service, that's showing the traits behind each verdict employing SHAP attributions and feeds analyst-confirmed cases back into the training, to a significant degree.
Section II reviews related work, what section III outlines is the framework, Section IV the experimental setup, Section V the projected findings and Section VI deployment, in many respects. Section VII is concluding.
II. Related Work
Together the principal lines of research on learned phishing detection are being covered by them, broadly speaking; in fact, Table I summarises five IEEE papers that bracket the topic, including a benchmarking framework, a feature-based ensemble, a transformer model, a deep-learning taxonomy and a recent feature-engineering framework, on the whole.
Three notes are following from the table. Feature-based ensembles are remaining competitive for starters up up, and deep models on raw URLs [3], [4] remove feature engineering. The meta-learner study [2] and the PhishOFE framework [5] both report precision near or above 97 %, with models that are cheap to run and easy to inspect, broadly speaking, and yet, inference time was cost by them and see only the URL string, which an attacker controls completely, in many respects.
Up next, check is the weak point of the field; the benchmark study [1] is suggesting that the ratio of legitimate to phishing samples changes classifier performance, in actual application. As, well, that attributes that worked on old data fail on new attacks; in fact, a detector that's scored on a random split of one dataset hasn't been shown to cope with either effect, on the whole.
Later on, the operating point matters as much as the exactness; the transformer study [3] reports its comparison at a false-positive rate of 0.01 %, because that's where a browser service has to operate, in real-world scenarios. As, well, adjusted probabilities are needed to set the threshold with any confidence, which is why accuracy figures at a 50 % threshold are saying little about that regime, in real-world scenarios.
The taxonomy in [4] also is showing why a tree-based design is a reasonable choice for a reproducible study, to a significant degree; and thus, the cost is feature engineering, which the first tier of the framework is mainly keeping small by using only cheap, well-understood signals, in actual application. Tabular features of the kind employed here suit gradient-boosted trees, which train quickly on one processor, handle missing values and produce exact attributions, and deep models need large labelled corpora, long training times and usually accelerators, so as well, as well, their decisions are harder to explain.
Earlier work points the same way. Sahingoz et al. [6] found Random Forest ran best on lexical URL features, and the widely employed 30-feature website dataset of Mohammad et al. [7] established the combination of URL, host, and page attributes that later studies generalize, in actual application; the suggested framework keeps this feature-based line, adds a adjusted threshold and a temporal protocol, and attaches an explanation to each decision, on the whole.
TABLE I. COMPARATIVE SUMMARY OF RECENT IEEE WORKS ON MACHINE-LEARNING PHISHING DETECTION
| Ref.   | Method   | Year   | Issue tackled   | Technical strategy   | Reported strength   | Principal shortcoming   |
| [1]   | PhishBench benchmarking framework   | 2020   | Published phishing results aren't comparable because traits, data and metrics differ.   | Combined framework with 226 attributes (83 URL/website, 143 e-mail) tested, under the same conditions, in many respects.   | As, well, retraining alone isn't enough. Here goes systematic benchmark; suggests imbalance hurts detectors.   | Evaluation tool, not a deployable detector; no explanation or deployment path.   |
| [2]   | AI meta-learners with Extra-Trees   | 2020   | High false-alarm rates and poor interpretability in AI-based detectors.   | AdaBoost, Bagging, Rotation Forest and LogitBoost wrapped around an Extra-Trees base learner.   | Precision of at least 97 % with a false-positive rate no higher than 0.028, on the whole.   | Single dataset; no tiered page evidence, calibrated threshold or live deployment.   |
| [3]   | URLTran (transformers)   | 2021   | Phishing URL detectors must work at very low false-positive rates.   | Pre-trained and fine-tuned BERT and RoBERTa on URLs; adversarial homoglyph and word-split tests.   | True-positive rate 86.8 % against 71.2 % for the next-best baseline at 0.01 % false positives, to a significant degree.   | URL text only; heavy inference; no host or page evidence.   |
| [4]   | Deep learning for phishing: taxonomy   | 2022   | Deep-learning phishing research is scattered and its open problems are unclear.   | Taxonomy of deep-learning approaches with current challenges and future directions.   | Organises the field and names the open problems.   | Survey only; no implementation.   |
| [5]   | PhishOFE   | 2025   | Feature sets are, for all practical purposes, chosen ad hoc and often hinge on third-party data.   | URL and HTML features plus derived composite features; ten classifiers compared.   | CatBoost reached 99.48 % accuracy and the design suits real-time use.   | Indication from one built dataset; no zero-day test or per-decision explanation is reported.   |
| —   | This work   | 2026   | Detection, calibration and explanation are usually treated separately.   | Forty tiered features, stacked ensemble, calibrated threshold, SHAP reasons.   | Low false-positive operation with zero-day evaluation and explanations.   | Design study; implementation pending.   |
III. Proposed Method
A. System Overview
This model has six stages (Fig. 1). A URL, a web address, is gained together with its DNS, certificate and, when reachable, page data, broadly speaking; in fact, attributes are pulled in three tiers and then cleaned and picked, so plus, the explanation stage reports the traits that pushed the score up or down, on the whole. A stacked ensemble returns a probability that's adjusted and checked with a threshold; and thus, the final stage is allowing, warns or blocks. And the verified outcome returns to the training data.
B. Dataset
Three data sources are, of course, planned (Table II). The first is the 30-feature Phishing Websites dataset [7], which holds 11,055 records and is used only to compare the classifier stack with earlier work, because it supplies pre-computed features and not raw URLs. Clearly, the second is the PhiUSIIL corpus [8] of 235,795 labelled URLs, employed for large-scale training, in actual application. The third is a live corpus to be collected over eight weeks, including confirmed phishing URLs from public feeds such as PhishTank and OpenPhish, and legitimate URLs drawn from the Tranco ranking [9], each stored with a timestamp and a page snapshot, in real-world scenarios. A temporal test can be supported by only the live corpus. On top of that, plus, it also is supplying the complete page data that the other two lack, in actual application.
TABLE II. PLANNED COMPOSITION OF THE DATA SOURCES
| Source   | Records   | Phishing / legitimate   | Role   |
| UCI Phishing Websites [7]   | 11,055   | 4,898 / 6,157   | Comparison on native features   |
| PhiUSIIL [8]   | 235,795   | 100,945 / 134,850   | Large-scale training   |
| Live corpus (target)   | 40,000   | 20,000 / 20,000   | Temporal and zero-day test   |
Entries are de-duplicated by full URL and then grouped by registered domain, so that all URLs of one domain fall on the same side of any split, on the whole. Where page content is unavailable for a record, the content features are marked missing and aren't invented, on the whole. The live corpus is split by time: weeks one to five for training, week six for validation and weeks seven and eight for testing.
Fig. 1. End-to-end architecture. The upper band shows the six runtime stages, the middle band the operation in each, and the lower band the offline training and feedback loop.
C. Feature Extraction
Each URL is read into the method, host, registered domain (employing the public suffix list), path and query, in many respects; percent-encoding is decoded and internationalised domain names are converted to their Unicode form so that homoglyph tricks can be detected, in many respects. Forty traits are then computed in three tiers (Fig. 2).
Fig. 2. (a) Raw URL. (b) Parsed parts. (c) Feature groups and tiers. (d) Forty-element vector. (e) Top-30 subset. The three groups are listed in the lower part.
Tier 1 is holding 18 lexical attributes computed from the string alone, such as URL, host and path length, counts of dots, hyphens and digits, the presence of an at-sign, an IP-address host, subdomain depth, a punycode or mixed-script flag, a URL-shortener flag, the count of words such as login, confirm, secure and account, and the Shannon entropy of the URL,
H(u) = −Σi pi log2 pi(1)
where pi is the relative frequency of the i-th separate character; in fact, a high entropy is being yielded by machine-generated names and long random tokens. Tier 2 is holding 8 host-based traits received from DNS, WHOIS and TLS lookups and cached by registered domain, such as domain age, registration length, number of DNS records, certificate validity, certificate age, issuer class, redirect-chain length and a popularity bucket of the hosting network, in actual application. Newly registered areas are a recurrent sign of phishing, but free certificates are typical, so the certificate features are weak alone and advantageous only in combination, in actual application.
Tier 3 holds 14 content features taken from a single HTML fetch with a short timeout and no script execution, namely whether a password field is present, the number of forms, whether a form hands in to another area, the share of links and embedded resources pointing off-site, the number of iframes and hidden iframes, scripts that are disabling the right-click menu or rewrite the status bar, an external favicon, empty or null anchors, and a mismatch between the page title and the domain, in many respects. A page that can't be fetched leaves these attributes missing; indeed, the fetch is running in an separated worker with no credentials. And because phishing kits often are blocking crawlers, the fetch outcome is typically itself a attribute, in actual application.
A latency budget was also set by The tiers; and thus, tier 1 costs well under a millisecond per URL and can, in practice, run inside the extension, in many respects. Tier 2 costs a network round trip on the first visit to a area and almost nothing afterwards, because of the cache, whose entries expire after twenty-four hours so that a domain that's changing hands is looked up again, to a significant degree, and seeing as, the attacker writes the page, Tier 3 is the most expensive and the most exposed to attacker control. That's why the content features are restricted to structural counts, and no page code is ever performed or rendered.
D. Pre-processing and Feature Selection
Tree-based learners need no scaling, so pre-processing concentrates on redundancy and leakage, which is why pairs of traits with Spearman correlation above 0.95 are usually reduced to one, on the whole; the remaining traits are, in practice, ranked by mutual information with the label [10],
I(X;Y) = Σx Σy p(x,y) log [ p(x,y) / (p(x) p(y)) ](2)
estimated with a nearest-neighbour estimator, and the top 30 are kept, and missing values are passed through the unchanged, namely XGBoost, LightGBM and CatBoost handle them natively, and the Random Forest implementation employed here does as well, in real-world scenarios. Both stages are fitted inside the training folds only, because a selection made on all the data would leak information from the test folds, in many respects.
The training sets are close to balanced; while real traffic isn't. The models are therefore trained with class weights and scored at a few supposed phishing prevalences, broadly speaking; indeed, oversampling with SMOTE is tested as an alternative, but only on the training folds [11], on the whole.
E. Stacked Ensemble
Four base learners are currently employed because they err in diverse ways. Random Forest [12] averages deep, decorrelated trees; XGBoost [13] grows regularised trees level by level; LightGBM [14] grows histogram-based trees leaf by leaf; CatBoost [15] is using ordered boosting and symmetric trees that are decreasing target leakage on categorical traits, to a significant degree; their out-of-fold probabilities zk, obtained with five-fold domain-grouped cross-validation, are the inputs of a logistic-regression meta-learner [16],
p = σ(β0 + Σk=14 βk zk)(3)
where σ is the logistic function and the coefficients β are fitted on the out-of-fold predictions only, so the meta-learner never sees a prediction made on data the base learner was trained on, to a significant degree, and fig. 3 is showing the architecture.
Fig. 3. The proposed classifier. Four base learners feed out-of-fold probabilities to a logistic meta-learner; the output is calibrated and thresholded, and SHAP reasons are attached.
Stacked probabilities are usually not well adjusted. What's more, a threshold set on uncalibrated scores drifts when the data change. Meaning, an isotonic regression g [17], fitted on the validation set, maps the stacked score to a adjusted probability,
p̂ = g(p), g non-decreasing, minimising Σi (yi − g(pi))²(4)
so that a reported probability of 0.9 corresponds to roughly nine phishing pages in ten among pages with that score, to a significant degree.
F. Training Objective and Operating Threshold
Each base learner is typically trained with a class-weighted log-loss,
L = −(1/N) Σi [ w1 yi are logging pi + w0 (1 − yi) log(1 − pi) ],(5)
wc = N / (C · nc),(6)
where N is the number of training samples, C = 2 and nc is the count of class c. The weights balance the classes during the learning, broadly speaking. The asymmetry between a missed phishing page and a false warning isn't placed in the loss; it's placed in the threshold, which is chosen on the validation set as the one with the highest recall among those that keep the false-positive rate within a budget α [3], [18]:
τ = argmaxτ R(τ)  subject to  FPR(τ) ≤ α,  α = 0.01(7)
A second, lower threshold is generating a warning instead of a block; in fact, pages scoring below it are currently permitted. Separating the two thresholds lets an organization tighten or relax the policy without retraining, in actual application.
G. Explanation
Each verdict is accompanied by the three features that contributed most to the score; these are computed with TreeSHAP [19] on the base learner that receives the largest meta-learner weight, broadly speaking. What's behind it is therefore an approximation of the ensemble's reasoning, and the interface states this, on the whole. An analyst who is seeing, to take one instance, that a young domain, an external form action and a password field drove a block can confirm or overturn it quickly, and the correction becomes a training label.
H. Training Workflow
Fig. 4 summarises three stages - data preparation, training and evaluation with release; in fact, all random seeds are fixed, and every experiment is repeated with five seeds so that findings are reported as a mean and a standard departure, in many respects. Hyper-parameters of each learner are tuned by Bayesian optimisation with Optuna [20] for 60 trials, maximising the subfield, under the precision-recall curve on the validation set, with early stopping after 50 rounds, in many respects.
Fig. 4. The research pipeline in three stages: data preparation, training, and evaluation with release.
IV. Experimental Setup
This model will maybe be used in Python 3.11 with scikit-learn [21], XGBoost, LightGBM, CatBoost and SHAP, the service in FastAPI, and the client as a Chrome extension employing Manifest V3, broadly speaking; Table III is listing the arrangement. Hyper-parameters are fixed once on the validation data and left unchanged during the testing, broadly speaking; no graphics card is, as a practical matter, needed - training and inference are often planned on a single eight-core processor with 16 GB of memory.
TABLE III. TRAINING AND ENSEMBLE CONFIGURATION
| Parameter   | Setting   |
| Feature groups   | 18 lexical, 8 host, 14 content (40 total)   |
| Redundancy filter   | Spearman |ρ| > 0.95, one of each pair dropped   |
| Selection   | Mutual information, top 30 features   |
| Random Forest   | 300 trees, minimum leaf size 2   |
| XGBoost   | 400 rounds, learning rate 0.05, depth 6, subsample 0.8   |
| LightGBM   | 500 rounds, 31 leaves, learning rate 0.05   |
| CatBoost   | 600 iterations, depth 6, learning rate 0.05   |
| Meta-learner   | Logistic regression, L2, C = 1.0   |
| Class handling   | Balanced weights; SMOTE as ablation (k = 5)   |
| Calibration   | Isotonic regression on validation set   |
| False-positive budget α   | 1 % (block); 0.1 % tested in ablation   |
| Validation protocol   | Five-fold, grouped by registered domain   |
| Repetitions   | Five random seeds   |
Three rules are employed. The 30-feature dataset [7] is used only for the comparison of the classifier stack with earlier work on same attributes, to a significant degree; in fact, Protocol C is the temporal split of the live corpus. Protocol B trains on PhiUSIIL and tests on the live corpus, which measures how much performance is lost when the data source changes, in real-world scenarios; On PhiUSIIL, Protocol A is a five-fold domain-grouped cross-validation.
Detection quality is measured by precision, recall, F1 and the false-positive rate,
P = TP/(TP + FP),  R = TP/(TP + FN),(8)
F1 = 2PR/(P + R),(9)
FPR = FP/(FP + TN)(10)
together with the subfield under the ROC and precision-recall curves, the median inference time per URL and the calibration error, in many respects. As, the live corpus is usually time-ordered, a zero-day recall is also reported - the recall on phishing URLs whose registered domain first appears after the training period,
ZDR = TPnew / (TPnew + FNnew). (11)
What's more, classifiers are checked with McNemar's test on the same test items; in turn, on top of that, confidence intervals come from a paired bootstrap over areas, on the whole.
Baselines are chosen to make the comparison fair; logistic regression on the same traits is showing how much a nonlinear model adds, to a significant degree. Each base learner is also checked alone, a blocklist lookup represents the rolled out status quo, and the models of [2] and [5] are re-implemented on the same data wherever their descriptions are allowing, since figures copied from papers that employed other data can't be checked directly [1], in actual application. Training time, memory use and model size are recorded as well, because a browser service must carry them, to a significant degree.
V. Anticipated Results and Discussion
This model hasn't been trained to completion, so every figure in this section is a projection and not a measurement, in real-world scenarios. The reference range is the 97 to 99 % accuracy reported for feature-based ensembles [2], [5], to which the anticipated effect of each design choice has been added, in real-world scenarios. Fig. 5 and Table IV are therefore targets to be inspected with the real code, under one protocol on the same data, to a significant degree. False-positive rates in the tables are, in practice, worked out from the projected precision and recall for a test set with 43 % phishing samples.
Fig. 5. (a) Projected precision, recall and F1. (b) Illustrative projected ROC curves through the projected operating points. Both are analytical projections, not measurements.
TABLE IV. PROJECTED DETECTION PERFORMANCE AGAINST REFERENCE APPROACHES
| Approach   | Prec. (%)   | Rec. (%)   | F1 (%)   | FPR (%)   | Time (ms)   |
| Blocklist lookup   | 98.2   | 61.5   | 75.6   | 0.85   | 2   |
| Logistic regression   | 90.4   | 88.7   | 89.5   | 7.11   | 3   |
| Extra-Trees meta [2]   | 97.4   | 97.0   | 97.2   | 1.95   | 18   |
| Single CatBoost [5]   | 98.3   | 98.0   | 98.1   | 1.28   | 12   |
| Proposed framework   | 98.9   | 98.6   | 98.7   | 0.83   | 24   |
Reference rows are showed levels that must be re-measured, under one protocol; suggested values are projections, broadly speaking. Network fetches are being excluded by time.
Three points about Table IV. Let's start up, the gain over the single CatBoost model is small, about 0.6 points of F1. And it's projected to come mainly from the stack and from calibration, which lower the false-positive rate more than they're raising recall. A gain this size can only be validated with repeated seeds and a paired test. After that on, the blocklist is projected to highly precis and poor recall, since it can only list what has been reported. Right so, the projected time of 24 ms per URL is excluding DNS, WHOIS and page fetches, which are dominating real latency and are the reason for the caching and tiering in Section III.
The second panel of Fig. 5 matters more than the first; at a 1 % false-positive budget the suggested model is projected to keep recall above 98 %, to a significant degree. A browser service would run at a far lower budget, and there the benefit of adjusted scores becomes visible; it's the first thing the experiments must test, to a significant degree, and precision also hinges on how rare phishing is. A figure measured on a balanced test set mustn't be quoted as what a user will (in actual operation) experience. At the projected recall of 98 % and a false-positive rate of 0.1 %, precision is about 91 % when 1 % of the pages are phishing, as the following arithmetic shows: 0.98 × 0.01 divided by (0.98 × 0.01 + 0.001 × 0.99), in many respects.
The ablation removes one component at a time (Table V) and fixes the protocol in advance, in actual application; a single learner in place of the stack should cost a small amount of accuracy, in actual application. Removing the content features should hurt most, particularly on zero-day phishing, because a newly registered domain with an ordinary-looking URL is often uncovered only by its form and password field, and removing host features should cost little exactness but would save network lookups; so, dropping class weighting should leave precision high and lower recall. What's more, removing calibration should leave F1 almost unchanged while raising the false-positive rate at a fixed threshold; a finding that departs from these expectations would be informative in itself.
TABLE V. EXPECTED ABLATION OF THE PRINCIPAL COMPONENTS
| Configuration   | F1 (%)   | FPR (%)   | Zero-day recall (%)   |
| Complete framework   | 98.7   | 0.83   | 96.8   |
| Without content features   | 97.3   | 1.80   | 91.5   |
| Without host features   | 98.0   | 1.43   | 95.9   |
| Without class weighting   | 97.6   | 0.73   | 93.4   |
| Single learner, no stack   | 98.1   | 1.28   | 95.6   |
| Without calibration   | 98.3   | 1.60   | 96.7   |
The first and fourth rows carry the central hypothesis; indeed, if content features raise zero-day recall as projected, the extra fetch is worth its cost for pages that the cheaper tiers can't settle, in real-world scenarios. If the stack with calibration doesn't beat a tuned single CatBoost model by a margin that exceeds the seed-to-seed fluctuation, the added complexity isn't backed up, broadly speaking, and the simpler model should be kept.
Beyond the averages, an error analysis will probably be covered by the check. False positives will be found by category, to take one instance newly launched legitimate sites, URL shorteners, login portals of small organizations and sites behind content-delivery networks, because these are the cases where young areas and external forms resemble phishing. And negatives will be grouped by the kind of evasion, such as compromised legitimate domains, which carry good host features, and pages that cloak. What's more, the categories will be reported so that readers can see where the framework shouldn't be trusted. If deviations concentrate in one category, the fix may be a new trait and not a larger model.
Four shortcomings should be stated. Well the same, continual retraining and monitoring [1] are being needed by the model, in real-world scenarios; and thus, public datasets are labelled by feeds that themselves rest on detection, so a model may (in practical terms) learn what the feeds catch and not what phishing is, in many respects. All values are projections and need experimental confirmation; what's more, free certificates are weakening host features. Attackers are adjusting, namely cloaking, what which is showing is a harmless page to crawlers, defeats content features, and finally, URL strings can (to some degree) be crafted to resemble legitimate ones, which is the weakness that adversarial tests on text models expose [3].
VI. Deployment and Governance
A detector is valuable only if it can be run safely; and thus, as, well, the governance tier is holding the policy, the analyst review queue and the monitoring, in real-world scenarios. Fig. 6 is showing four tiers. The client tier is a browser extension that's running the lexical check locally and calls the service only when needed, in actual application; the intelligence tier preserves the confirmed feeds and the labelled store and schedules retraining. The analysis tier hosts the feature extractor likely, the host cache, the ensemble and the explainer, on the whole.
Fig. 6. Four-tier deployment: client, analysis, intelligence and governance. Confirmed verdicts return to the labelled store.
The latency budget is set per tier. As, well, a warning is shown only if the earlier tiers already put the page in the warning band; this keeps the widespread case, an ordinary site that scores low, free of delay; it's keeping the cost of the slow tier proportional to the doubt that's remaining, on the whole. The optional content fetch completes in the background; before the page begins to load, the local lexical check should finish. And a cached host lookup should add little.
Governance rests on four rules. Then, monitoring: the share of blocked pages, the score distribution and the analyst override rate are tracked, in many respects; and thus, fourth, the thresholds belong to the organization and are logged, so that a stricter policy can (to a meaningful extent) be employed after an incident without changing the model, on the whole. What's more, each override is logged as a label for review; next, a block is reversible, like the user can continue after a clear warning. Plus drift or an attack on the detector are, put simply, being signaled by a sharp change in any of them and starts a retraining review. For starters, privacy, including URLs can comprise tokens, e-mail addresses and session identifiers, so the extension removes query values before anything leaves the device and sends the registered domain and a reduced path whenever possible.
VII. Conclusion and Future Scope
This paper suggested a framework for detecting phishing websites that's combining forty tiered URL, host and content features with a stacked ensemble of four tree-based learners, a adjusted decision threshold chosen under a false-positive budget, and per-decision explanations, and is a design study, in real-world scenarios. The projections in Section V indicate that the design is normally worth building. And they're fixing in advance the metrics, rules and ablations by which it will (in practice) be judged, in many respects. Setup and evaluation on the three data sources of Section III come next.
Several questions are remaining open. Visual similarity to the impersonated brand, such as logo and layout comparison, could add indication that text attributes miss, and compact URL transformers [3] could be tested as a fifth base learner under the same latency limits, in many respects; and thus, robustness to adaptive attackers, including cloaking and generated look-alike areas, deserves its own study, and so does federated or on-device training that's keeping browsing data private, in real-world scenarios. The most urgent step is validation on live traffic, across the regions and languages, since a model trained on one feed can't be supposed to transfer.
Acknowledgment
The author thanks Assistant Professor Vivek Saxena of the Department of Computer Engineering, Poornima Institute of Engineering and Technology, for guidance on the direction and presentation of this work, and the department for the computing facilities, in actual application.
References
[1]A. El Aassal, S. Baki, A. Das, and R. M. Verma, “An in-depth benchmarking and evaluation of phishing detection research for security needs,” IEEE Access, vol. 8, pp. 22170–22192, 2020.
[2]Y. A. Alsariera, V. E. Adeyemo, A. O. Balogun, and A. K. Alazzawi, “AI meta-learners and Extra-Trees algorithm for the detection of phishing websites,” IEEE Access, vol. 8, pp. 142532–142542, 2020.
[3]P. Maneriker, J. W. Stokes, E. G. Lazo, D. Carutasu, F. Tajaddodianfar, and A. Gururajan, “URLTran: Improving phishing URL detection using transformers,” in Proc. IEEE Military Communications Conf. (MILCOM), 2021, pp. 197–204.
[4]N. Q. Do, A. Selamat, O. Krejcar, E. Herrera-Viedma, and H. Fujita, “Deep learning for phishing detection: Taxonomy, current challenges and future directions,” IEEE Access, vol. 10, pp. 36429–36463, 2022.
[5]Y. A. Kustiawan and K. I. Ghauth, “PhishOFE: A novel machine learning framework for real-time phishing URL detection with optimized feature engineering,” IEEE Access, vol. 13, pp. 169606–169627, 2025.
[6]O. K. Sahingoz, E. Buber, O. Demir, and B. Diri, “Machine learning based phishing detection from URLs,” Expert Systems with Applications, vol. 117, pp. 345–357, 2019.
[7]R. M. Mohammad, F. Thabtah, and L. McCluskey, “Predicting phishing websites based on self-structuring neural network,” Neural Computing and Applications, vol. 25, no. 2, pp. 443–458, 2014.
[8]A. Prasad and S. Chandra, “PhiUSIIL: A diverse security profile empowered phishing URL detection framework based on similarity index and incremental learning,” Computers & Security, vol. 136, art. 103545, 2024.
[9]V. Le Pochat, T. Van Goethem, S. Tajalizadehkhoob, M. Korczyński, and W. Joosen, “Tranco: A research-oriented top sites ranking hardened against manipulation,” in Proc. Network and Distributed System Security Symp. (NDSS), 2019.
[10]A. Kraskov, H. Stögbauer, and P. Grassberger, “Estimating mutual information,” Physical Review E, vol. 69, art. 066138, 2004.
[11]N. V. Chawla, K. W. Bowyer, L. O. Hall, and W. P. Kegelmeyer, “SMOTE: Synthetic minority over-sampling technique,” J. Artificial Intelligence Research, vol. 16, pp. 321–357, 2002.
[12]L. Breiman, “Random forests,” Machine Learning, vol. 45, no. 1, pp. 5–32, 2001.
[13]T. Chen and C. Guestrin, “XGBoost: A scalable tree boosting system,” in Proc. ACM SIGKDD Int. Conf. Knowledge Discovery and Data Mining, 2016, pp. 785–794.
[14]G. Ke et al., “LightGBM: A highly efficient gradient boosting decision tree,” in Advances in Neural Information Processing Systems (NeurIPS), 2017, pp. 3146–3154.
[15]L. Prokhorenkova, G. Gusev, A. Vorobev, A. V. Dorogush, and A. Gulin, “CatBoost: Unbiased boosting with categorical features,” in Advances in Neural Information Processing Systems (NeurIPS), 2018, pp. 6638–6648.
[16]D. H. Wolpert, “Stacked generalization,” Neural Networks, vol. 5, no. 2, pp. 241–259, 1992.
[17]A. Niculescu-Mizil and R. Caruana, “Predicting good probabilities with supervised learning,” in Proc. Int. Conf. Machine Learning (ICML), 2005, pp. 625–632.
[18]H. He and E. A. Garcia, “Learning from imbalanced data,” IEEE Trans. Knowledge and Data Engineering, vol. 21, no. 9, pp. 1263–1284, 2009.
[19]S. M. Lundberg and S.-I. Lee, “A unified approach to interpreting model predictions,” in Advances in Neural Information Processing Systems (NeurIPS), 2017, pp. 4765–4774.
[20]T. Akiba, S. Sano, T. Yanase, T. Ohta, and M. Koyama, “Optuna: A next-generation hyperparameter optimization framework,” in Proc. ACM SIGKDD Int. Conf. Knowledge Discovery and Data Mining, 2019, pp. 2623–2631.
[21]F. Pedregosa et al., “Scikit-learn: Machine learning in Python,” J. Machine Learning Research, vol. 12, pp. 2825–2830, 2011.`
  },
  {
    id: 'ieee-ai',
    title: 'Adaptive Neural Architecture Search for Edge Devices',
    category: 'AI & Machine Learning (IEEE / Conference)',
    description: 'A messy unformatted draft about neural network optimization on edge hardware.',
    content: `Adaptive Neural Architecture Search for Edge Devices with Dynamic Quantization Constraints
Dr. Sarah Jenkins, Dept of Computer Science, Stanford University, sarah.jenkins@stanford.edu
Alex Rivera, AI Research Labs, Google Deepmind, arivera@deepmind.com
Prof. Kenji Takahashi, School of Information, University of Tokyo, kenji@u-tokyo.ac.jp

Abstract: Edge computing systems operate under strict thermal, compute, and energy limitations. Traditional neural architecture search methods design models for high accuracy on desktop GPUs without considering hardware-specific memory bottlenecks. In this paper, we propose E-NAS, an evolutionary adaptive neural architecture search framework specifically designed for sub-watt edge processors. By incorporating runtime dynamic quantization feedback directly into the Pareto-optimal search loop, our approach discovers lightweight models that achieve 84.7% Top-1 accuracy on ImageNet with 3.2x lower latency than MobileNetV3. Our results demonstrate that hardware-in-the-loop pruning combined with mixed-precision weights preserves model fidelity while dramatically shrinking memory footprint.

Keywords: Neural Architecture Search, Edge Computing, Quantization, Pareto Optimization, Deep Learning, Mobile AI

1. Introduction
Modern edge devices such as smart cameras, wearable biomedical monitors, and autonomous drones require low-latency real-time inference. However, state-of-the-art vision models such as Vision Transformers and deep convolutional networks demand gigabytes of floating-point operations.

Deploying such models on low-power microcontrollers or mobile NPUs causes thermal throttling and rapid battery drain. The challenge is formulating an automated search pipeline that factors in latency, flash memory constraints, and SRAM cache limits simultaneously.

2. Related Work
Previous efforts in automated machine learning (AutoML) predominantly optimized for floating-point operations (FLOPs). However, as shown by recent studies, FLOP count correlates poorly with real execution time on heterogeneous mobile architectures.

Weight quantization techniques such as INT8 and INT4 post-training quantization reduce memory traffic. Yet, quantizing a model after architectural search frequently induces unpredictable accuracy loss on sensitive attention layers.

3. Proposed Methodology
Our framework consists of three intertwined components: a supernet sampling controller, a hardware latency surrogate estimator, and an iterative quantization-aware evolutionary optimizer.

Equation 1:
L_total = alpha * L_accuracy + beta * L_latency + gamma * L_memory

The optimization objective minimizes overall task loss subject to maximum hardware memory bounds. The search space spans inverted residual blocks, depthwise separable convolutions, and linear bottleneck layers with variable expansion ratios (2x, 4x, 6x).

3.1 Dynamic Quantization Search
Instead of uniform precision across all layers, we formulate precision assignment as a discrete search variable:
P_i in {FP16, INT8, INT4} for each layer i in the backbone.

Sensory layers near the input are constrained to INT8 to preserve feature resolution, whereas deeper classification heads can tolerate aggressive 4-bit compression.

4. Experimental Results
We evaluated E-NAS on three target edge boards: Raspberry Pi 4 (Quad-core Cortex-A72), Jetson Nano (128-core Maxwell GPU), and STM32H7 microcontroller.

Table 1: Performance Benchmark across Edge Hardware Platforms
Platform | Baseline Top-1 Acc | E-NAS Top-1 Acc | Baseline Latency | E-NAS Latency | Memory Footprint
Raspberry Pi 4 | 78.2% | 84.7% | 48.2 ms | 15.1 ms | 8.4 MB
Jetson Nano | 80.5% | 85.1% | 22.4 ms | 7.9 ms | 9.1 MB
STM32H7 MCU | 69.4% | 76.8% | 185.0 ms | 46.2 ms | 1.8 MB

As shown in Table 1, E-NAS consistently reduces latency by 2.8x to 4.0x while increasing predictive accuracy over default baseline configurations.

Figure 1: Pareto frontier curve illustrating accuracy tradeoff versus latency on embedded hardware.

5. Conclusion
We presented E-NAS, an efficient neural architecture search pipeline incorporating dynamic quantization in the search loop. Our approach discovers ultra-compact models that outperform existing mobile architectures on diverse edge hardware. Future research will explore decentralized federated search over heterogeneous device clusters.

References:
[1] J. Smith and R. Taylor, "Hardware-aware neural architecture search," IEEE Transactions on Pattern Analysis, vol. 42, no. 8, pp. 1920-1934, 2021.
[2] L. Chen, M. Zhang, and K. Wang, "Mixed-precision deep neural networks for edge computing," IEEE Micro, vol. 39, no. 5, pp. 24-33, 2020.
[3] H. Howard et al., "Searching for MobileNetV3," in Proc. IEEE/CVF International Conference on Computer Vision (ICCV), 2019, pp. 1314-1324.
[4] P. Gupta, "Energy efficient inference on microcontrollers," ACM Transactions on Embedded Computing Systems, vol. 18, no. 3, pp. 45-58, 2022.`
  },
  {
    id: 'corporate-report',
    title: 'Enterprise Multi-Cloud Resilience & Migration Roadmap',
    category: 'Corporate Strategy (Professional Format)',
    description: 'An unformatted strategic IT executive report for enterprise infrastructure leaders.',
    content: `Enterprise Multi-Cloud Resilience and Migration Strategy
Prepared by: Marcus Vance, VP of Infrastructure Architecture, Global Cloud Solutions
Target Audience: Executive Leadership & IT Operations Committee
Date: October 2026 | Version: 2.4 | Status: Confidential Review

Executive Summary:
Over 68% of enterprise downtime events in the financial sector originate from single-region cloud dependency and unmitigated service provider outages. This strategic blueprint outlines our three-year roadmap to transform our legacy monolithic infrastructure into an active-active multi-cloud mesh operating across AWS, Google Cloud, and localized sovereign datacenters. Implementing this architecture will reduce Disaster Recovery Time Objective (RTO) from 4 hours to under 90 seconds, yield estimated annual cloud licensing savings of $3.4M, and guarantee 99.995% service availability for customer-facing core banking APIs.

Key Strategic Pillars:
- Zero-Downtime Traffic Steering via Global Anycast DNS
- Vendor-Agnostic Kubernetes Orchestration
- Automated Continuous Compliance and Data Sovereignty Auditing
- Real-time Cost Arbitrage and Spot Instance Fleet Optimization

1. Problem Statement and Current Architecture Vulnerabilities
Our current banking application ecosystem relies predominantly on a single cloud availability zone in us-east-1. Recent regional network disruptions highlighted three systemic risks:
First, data synchronization lag between primary and warm-standby databases exceeds acceptable recovery limits.
Second, proprietary cloud services lock our engineering teams into specific proprietary SDKs, increasing migration costs.
Third, upcoming European Union DORA (Digital Operational Resilience Act) regulations mandate demonstrable multi-vendor portability with severe financial penalties for non-compliance.

2. Architecture Blueprint: Active-Active Mesh
The target architecture distributes stateless microservices uniformly across three geographic clusters. State synchronization is maintained using a distributed consensus layer with globally consistent distributed SQL.

Operational Metrics Target:
Metric | Legacy Benchmark | Multi-Cloud Target | Target Timeline
RTO (Recovery Time Objective) | 240 minutes | < 1.5 minutes | Q2 2027
RPO (Recovery Point Objective) | 15 minutes | < 5 seconds | Q2 2027
Availability SLA | 99.9% | 99.995% | Q4 2026
Annual Run-Rate Cost | $18.2 Million | $14.8 Million | Q1 2028

3. Phased Execution Roadmap
Phase 1: Foundation and Tooling Harmonization (Months 1 - 6)
Deploy unified Terraform infrastructure-as-code modules and standardize CI/CD pipelines across all cloud accounts. Establish centralized observability using OpenTelemetry and distributed tracing.

Phase 2: Database and State Migration (Months 7 - 18)
Migrate relational transactional workloads to distributed Spanner/CockroachDB nodes across multi-cloud regions. Conduct monthly automated chaos engineering drills to simulate datacenter blackouts.

Phase 3: Production Cutover and Cost Optimization (Months 19 - 36)
Transition 100% of external API gateways to anycast routing. Turn on automated spot bidding to exploit cross-cloud price differentials.

4. Financial ROI and Risk Mitigation
Total capital expenditure for the transformation is projected at $4.2M over 24 months, with an estimated breakeven point at Month 16. Projected ongoing savings will fund our next-generation AI security initiatives.

Conclusion and Recommendations:
The executive board is requested to approve the initial Phase 1 budget allocation of $1.2M and authorize the creation of the dedicated Cloud Resilience Taskforce immediately.`
  },
  {
    id: 'academic-thesis',
    title: 'Cognitive Ergonomics in Human-AI Collaborative Decision Systems',
    category: 'Academic Manuscript (APA / University Thesis)',
    description: 'An unformatted research paper examining cognitive bias and automation complacency.',
    content: `Cognitive Ergonomics in Human-AI Collaborative Decision Systems: Analyzing the Effects of Explanations on Automation Bias
Elena Rostova, M.S.
Department of Psychology and Human-Computer Interaction
University of California, Berkeley
Advisor: Dr. Robert H. Henderson
Course: Advanced Cognitive Systems (PSYCH 380)
Date: Fall Semester 2026

Abstract
As artificial intelligence decision-support systems become ubiquitous in high-stakes fields such as oncology diagnostics and automated aviation, the risk of human automation complacency poses grave safety concerns. This study investigated how differing modalities of explainability (feature attribution versus counterfactual reasoning) influence user verification behavior and overall diagnostic accuracy. In a randomized controlled experiment with 140 licensed clinical professionals, participants evaluated 40 simulated radiology cases assisted by an AI model calibrated with intentional, controlled classification errors. Results indicated that while feature importance heatmaps increased subjective trust, counterfactual explanations prompted significantly higher critical verification and reduced false positive acceptance by 34.2% (p < .001). These findings emphasize that interface designers must prioritize cognitive friction over frictionless trust when engineering human-in-the-loop decision environments.

Keywords: Human-AI Interaction, Cognitive Ergonomics, Automation Bias, Explainable AI, Decision Making, Trust Calibration

Introduction
Human reliance on algorithmic guidance has transformed complex decision workflows. However, human operators routinely exhibit automation bias—the tendency to accept algorithmic recommendations uncritically, even in the presence of contradictory environmental evidence (Parasuraman & Manzey, 2010). In medical diagnostics, overreliance on automated anomaly detectors has been documented to impair radiologists' visual search strategies.

Literature Review and Theoretical Framework
Automation bias is fundamentally governed by dual-process cognitive theories (Kahneman, 2011). When presented with high-confidence algorithmic outputs, users default to System 1 heuristics to conserve mental energy. Explainable Artificial Intelligence (XAI) was initially proposed as a safeguard against this trap; however, recent empirical findings reveal that poorly framed explanations may paradoxically exacerbate trust by creating an illusion of infallibility (Bansal et al., 2021).

Methodology
Participants
A total of 140 licensed medical professionals (M_age = 38.4 years, SD = 7.2) were recruited from academic medical centers. Participants were randomly assigned to one of three experimental conditions:
1. Control Group: Standard AI prediction with confidence percentage only.
2. Saliency Group: AI prediction accompanied by Grad-CAM visual heatmaps.
3. Counterfactual Group: AI prediction paired with minimal counterfactual contrastive text.

Procedure and Task
Participants evaluated 40 chest radiograph studies containing ambiguous lung lesions. Unknown to the participants, the AI model was programmed to generate false positive findings on 8 select trials and false negative recommendations on 4 trials.

Results
Hypothesis 1 posited that counterfactual explanations would decrease the rate of uncritical acceptance during erroneous AI trials. A one-way analysis of variance (ANOVA) revealed significant differences between conditions, F(2, 137) = 28.64, p < .001, eta_p^2 = .29.

Participants in the counterfactual condition rejected erroneous AI advice at a rate of 72.8% (SD = 8.4%), compared to 48.1% (SD = 10.2%) in the saliency group and 39.5% (SD = 11.6%) in the control group.

Discussion
The data demonstrates that visual saliency maps frequently lull users into passive agreement by guiding visual attention directly to false artifacts. In contrast, counterfactual statements force cognitive deliberation by explicitly contrasting what was observed with what would alter the recommendation.

References
Bansal, G., Wu, T. S., Joyce, T. S., & Horvitz, E. (2021). Does the whole exceed its parts? The effect of AI explanations on complementary team performance. In Proceedings of the 2021 CHI Conference on Human Factors in Computing Systems (pp. 1-16).
Kahneman, D. (2011). Thinking, fast and slow. Farrar, Straus and Giroux.
Parasuraman, R., & Manzey, D. H. (2010). Complacency and bias in human use of automation: An attentional integration. Human Factors, 52(3), 381-410.
Sarter, N. B., & Schroeder, B. (2001). Supporting decision making and execution in complex environments: The effects of automated advice. Human Factors, 43(4), 573-583.`
  },
  {
    id: 'messy-raw',
    title: 'Unformatted Quick Notes on Quantum Cryptography',
    category: 'Messy Draft Notes (Auto-Structure Test)',
    description: 'Completely unformatted plain text with mixed case, no markdown, and raw lists.',
    content: `notes on post quantum cryptography and lattice based algorithms
author: dr alexander lee
affiliated with national institute of cybersecurity
email: a.lee@nist-crypto.gov

abstract of the draft:
This quick note covers why rsa and ecc will break when shor's algorithm runs on fault-tolerant quantum computers with 4000 logical qubits. We review kyber for key encapsulation and dilithium for digital signatures. NIST standardizations and performance benchmarks on ARM cortex-m4 microcontrollers are summarized.

keywords: quantum computing, cryptography, lattice theory, post-quantum, security

introduction
classical asymmetric cryptography is fundamentally threatened by quantum algorithms. Shor's algorithm provides polynomial time factorization of large composite integers. Grover's algorithm provides quadratic speedup for unstructured database searches, effectively halving symmetric key lengths.

key post quantum paradigms
1. lattice based cryptography: based on learning with errors (LWE) and shortest vector problem in n-dimensional lattices. Examples include crystals-kyber and crystals-dilithium.
2. code based cryptography: classic mceliece based on goppa codes. Extremely high public key sizes but very compact ciphertexts.
3. hash based signatures: sphincs+ which relies solely on collision resistance of cryptographic hash functions.
4. isogeny based cryptography: sike was broken in 2022 via castryck-decru attack.

benchmarking results on arm cortex m4
Algorithm | Operation | Cycles | Stack Usage
Kyber-512 | KeyGen | 462,000 | 2.4 KB
Kyber-512 | Encaps | 581,000 | 2.8 KB
Kyber-512 | Decaps | 563,000 | 2.6 KB
Dilithium-2 | Sign | 1,280,000 | 5.2 KB
Dilithium-2 | Verify | 340,000 | 3.1 KB

conclusion
Organizations must start quantum readiness assessments immediately. Hybrid classical and post-quantum handshakes should be deployed in TLS 1.3 to guard against harvest-now-decrypt-later attacks.

references
1. P. Shor, Polynomial-time algorithms for prime factorization on a quantum computer, SIAM J. Comput., 1997.
2. NIST Post-Quantum Cryptography Standardization Round 3 Reports, 2024.
3. E. Alkim et al., Post-quantum key exchange on ARM Cortex-M4, IACR Cryptology ePrint, 2021.`
  }
];

export const SAMPLE_REFERENCE_FORMATS = [
  {
    id: 'nature-journal',
    name: 'Nature Journal Editorial Style',
    formatType: 'Academic / Scientific High-Impact',
    badge: 'Dual Column Serif & Crimson Accent',
    fileName: 'nature_reference_style.doc',
    styleProfile: {
      name: 'Nature Scientific Format',
      fontFamily: "'Source Serif 4', Georgia, serif",
      baseFontSize: '10.5pt',
      headingFontFamily: "'Plus Jakarta Sans', sans-serif",
      h1Style: { size: '15pt', weight: '700', transform: 'none', numbering: 'decimal', color: '#991b1b' },
      h2Style: { size: '12pt', weight: '600', transform: 'none', numbering: 'none', color: '#1e293b' },
      lineHeight: '1.55',
      paragraphIndent: '0in',
      paragraphSpacing: '0.85rem',
      textAlign: 'justify',
      columns: 2,
      margins: '0.85in',
      citationStyle: 'superscript',
      accentColor: '#991b1b',
      badgeLabel: 'Nature Cloned',
      confidenceScore: 98,
      detectedAttributes: [
        'Balanced dual-column body layout with wide top banner',
        'Distinct Crimson (#991b1b) primary heading accents',
        'Hybrid Serif body (Source Serif 4) + Sans-serif headings',
        'Superscript citation references with compact bottom bibliography',
        'Block paragraph spacing with zero indentation'
      ]
    }
  },
  {
    id: 'acm-sigchi',
    name: 'ACM SIGCHI Conference Proceedings',
    formatType: 'Computer Science Proceedings',
    badge: 'Single Column Clean Sans & Indigo Accents',
    fileName: 'acm_sigchi_guideline.pdf',
    styleProfile: {
      name: 'ACM SIGCHI Conference Format',
      fontFamily: "'Inter', -apple-system, sans-serif",
      baseFontSize: '10pt',
      headingFontFamily: "'Plus Jakarta Sans', sans-serif",
      h1Style: { size: '16pt', weight: '800', transform: 'uppercase', numbering: 'decimal', color: '#1e40af' },
      h2Style: { size: '13pt', weight: '700', transform: 'none', numbering: 'decimal', color: '#334155' },
      lineHeight: '1.6',
      paragraphIndent: '0in',
      paragraphSpacing: '0.75rem',
      textAlign: 'left',
      columns: 1,
      margins: '1.2in',
      citationStyle: 'bracket',
      accentColor: '#1e40af',
      badgeLabel: 'ACM Cloned',
      confidenceScore: 95,
      detectedAttributes: [
        'Spacious single-column layout with 1.2-inch readability margins',
        'High-legibility sans-serif typography (Inter & Plus Jakarta Sans)',
        'Numbered decimal headings with Royal Indigo (#1e40af) accents',
        'Bracketed citation notation [1], [2] with alphabetic bibliography',
        'Modern card-style abstract container with soft pill badges'
      ]
    }
  },
  {
    id: 'mckinsey-brief',
    name: 'McKinsey Executive Briefing Format',
    formatType: 'Management Consulting Whitepaper',
    badge: 'Corporate Slate & Deep Navy with Metadata Grid',
    fileName: 'mckinsey_briefing_template.docx',
    styleProfile: {
      name: 'Executive Advisory Whitepaper',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      baseFontSize: '11pt',
      headingFontFamily: "'Plus Jakarta Sans', sans-serif",
      h1Style: { size: '18pt', weight: '700', transform: 'none', numbering: 'pill', color: '#0f172a' },
      h2Style: { size: '13.5pt', weight: '600', transform: 'none', numbering: 'none', color: '#2563eb' },
      lineHeight: '1.65',
      paragraphIndent: '0in',
      paragraphSpacing: '1rem',
      textAlign: 'left',
      columns: 1,
      margins: '1in',
      citationStyle: 'footnote',
      accentColor: '#0284c7',
      badgeLabel: 'Executive Cloned',
      confidenceScore: 97,
      detectedAttributes: [
        'Executive metadata banner with status indicators & author credentials',
        'Sleek pill badges on major section headers',
        'Highlighted callout blocks with left accent borders for key findings',
        'Zebra-striped corporate metrics tables with formatted headers',
        'Page header/footer with confidentiality stamp and dynamic page numbers'
      ]
    }
  }
];
