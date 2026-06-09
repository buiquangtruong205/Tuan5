# Dinh dang JSON cua cac API

Tai lieu nay mo ta request va response JSON cua cac API trong Lab 5. Cac vi du duoi day dung khi service dang chay tai:

```text
http://localhost:8000
```

## 1. GET /

API kiem tra thong tin tong quan cua service.

### Request

Khong co request body.

### Response JSON

```json
{
  "service": "Lab 5 Dockerized Multi-Model AIoT Inference Service",
  "docs": "/docs",
  "image_upload_demo": "/classify-image-demo",
  "endpoints": [
    "/health",
    "/model-info",
    "/detect-anomaly",
    "/forecast",
    "/predict-risk",
    "/vision/model-info",
    "/classify-image",
    "/classify-image-annotated",
    "/classify-image-demo"
  ]
}
```

## 2. GET /health

API kiem tra trang thai service va model anh.

### Request

Khong co request body.

### Response JSON

```json
{
  "service_status": "ok",
  "model_dir": "models",
  "output_dir": "outputs",
  "vision_model_loaded": true
}
```

## 3. GET /model-info

API xem thong tin cac model trong service.

### Request

Khong co request body.

### Response JSON

```json
{
  "service_type": "multi_model_aiot_inference",
  "sensor_models": {
    "anomaly": "zscore_fallback_v1",
    "forecast": "moving_average_baseline_v1"
  },
  "vision_model": {
    "model_loaded": true,
    "model_name": "squeezenet1.1_onnx_imagenet1k",
    "model_version": "vision_squeezenet_onnx_v2",
    "task": "image_classification",
    "num_classes": 1000,
    "input_size": "224x224",
    "runtime": "onnxruntime_cpu",
    "model_format": "ONNX",
    "model_path": "models/vision/squeezenet1.1-7.onnx",
    "labels_loaded": true,
    "status_message": "loaded",
    "download_hint": "Run: python scripts/download_vision_model.py",
    "student_note": "The image model is not trained in Lab 5. Lab 5 teaches inference, API, UI, Docker, and model packaging."
  },
  "model_format_learning_path": [
    "Start with framework-native models: PyTorch .pt/.pth and TensorFlow .keras/SavedModel.",
    "Then convert or export to portable inference formats such as ONNX or lightweight edge formats such as TFLite.",
    "Use Docker to package runtime, dependencies, model files, and API behavior into a reproducible service."
  ],
  "note": "Lab 5 focuses on deployment/inference. Stronger sensor models are trained in Lab 3 and Lab 4."
}
```

## 4. POST /detect-anomaly

API phat hien bat thuong cua du lieu cam bien bang Z-score.

### Request JSON

```json
{
  "target": "temperature",
  "current_value": 38.5,
  "recent_values": [30.1, 30.3, 30.2, 30.5, 30.4],
  "threshold_z": 2.5
}
```

### Y nghia field request

| Field | Kieu du lieu | Bat buoc | Mo ta |
|---|---:|---:|---|
| `target` | string | Khong | Ten dai luong cam bien, mac dinh la `temperature` |
| `current_value` | number | Co | Gia tri hien tai can kiem tra |
| `recent_values` | array number | Khong | Cac gia tri gan day dung de tinh mean va standard deviation |
| `threshold_z` | number | Khong | Nguong Z-score, mac dinh la `2.5` |

### Response JSON

```json
{
  "model_output": {
    "anomaly_score": 16.113086,
    "threshold_used": 2.5,
    "is_anomaly": true,
    "model_version": "zscore_fallback_v1"
  },
  "event": {
    "severity": "HIGH",
    "decision": "CREATE_ALERT_AND_REQUIRE_HUMAN_CHECK",
    "explanation": "z-score=16.113, mean=30.300, std=0.113",
    "safety_note": "Khong tu dong dieu khien thiet bi chi dua tren mot diem anomaly."
  }
}
```

## 5. POST /forecast

API du bao gia tri cam bien bang trung binh truot.

### Request JSON

```json
{
  "target": "co2",
  "recent_values": [820, 845, 870, 900, 930],
  "horizon_minutes": 15,
  "model_version": "moving_average_baseline_v1"
}
```

### Y nghia field request

| Field | Kieu du lieu | Bat buoc | Mo ta |
|---|---:|---:|---|
| `target` | string | Khong | Ten dai luong cam bien, mac dinh la `co2` |
| `recent_values` | array number | Co | Cac gia tri gan day dung de tinh du bao |
| `horizon_minutes` | integer | Khong | Khoang thoi gian du bao, mac dinh la `15` phut |
| `model_version` | string | Khong | Version model, mac dinh la `moving_average_baseline_v1` |

### Response JSON

```json
{
  "model_output": {
    "predicted_value": 873.0,
    "last_value": 930.0,
    "forecast_delta": -57.0,
    "forecast_horizon_minutes": 15,
    "model_version": "moving_average_baseline_v1"
  },
  "evaluation_hint": {
    "note": "Lab 5 dung baseline inference demo. Metric day du da hoc o Lab 4."
  }
}
```

## 6. POST /predict-risk

API danh gia muc rui ro dua tren gia tri du bao.

### Request JSON

```json
{
  "target": "co2",
  "predicted_value": 1100,
  "warning_threshold": 1000,
  "high_threshold": 1200
}
```

### Y nghia field request

| Field | Kieu du lieu | Bat buoc | Mo ta |
|---|---:|---:|---|
| `target` | string | Khong | Ten dai luong cam bien, mac dinh la `co2` |
| `predicted_value` | number | Co | Gia tri du bao dau vao |
| `warning_threshold` | number | Khong | Nguong canh bao, mac dinh la `1000.0` |
| `high_threshold` | number | Khong | Nguong nguy hiem cao, mac dinh la `1200.0` |

### Response JSON

```json
{
  "decision": {
    "risk_level": "WARNING",
    "recommendation": "IMPROVE_MONITORING_OR_PREPARE_ACTION",
    "safety_note": "Forecast output must pass decision and safety rules before controlling devices."
  }
}
```

## 7. GET /vision/model-info

API xem thong tin rieng cua model anh.

### Request

Khong co request body.

### Response JSON

```json
{
  "model_loaded": true,
  "model_name": "squeezenet1.1_onnx_imagenet1k",
  "model_version": "vision_squeezenet_onnx_v2",
  "task": "image_classification",
  "num_classes": 1000,
  "input_size": "224x224",
  "runtime": "onnxruntime_cpu",
  "model_format": "ONNX",
  "model_path": "models/vision/squeezenet1.1-7.onnx",
  "labels_loaded": true,
  "status_message": "loaded",
  "download_hint": "Run: python scripts/download_vision_model.py",
  "student_note": "The image model is not trained in Lab 5. Lab 5 teaches inference, API, UI, Docker, and model packaging."
}
```

## 8. POST /classify-image

API phan loai anh bang model SqueezeNet ONNX ImageNet-1K.

API nay khong nhan JSON body. Request dung `multipart/form-data`.

### Request form-data

| Field | Kieu du lieu | Bat buoc | Mo ta |
|---|---:|---:|---|
| `file` | file image | Co | File anh can phan loai |
| `top_k` | query integer | Khong | So class tra ve, tu `1` den `10`, mac dinh la `5` |

### Vi du curl

```bash
curl -X POST "http://localhost:8000/classify-image?top_k=5" \
  -F "file=@sample_images/classroom_object.jpg"
```

### Response JSON

```json
{
  "model_output": {
    "task": "image_classification",
    "model_name": "squeezenet1.1_onnx_imagenet1k",
    "model_version": "vision_squeezenet_onnx_v2",
    "model_format": "ONNX",
    "top_k": 5,
    "predictions": [
      {
        "rank": 1,
        "class_id": 620,
        "class_name": "laptop",
        "confidence": 0.734512
      },
      {
        "rank": 2,
        "class_id": 681,
        "class_name": "notebook",
        "confidence": 0.084231
      }
    ],
    "inference_time_ms": 42.318
  },
  "decision": {
    "confidence_level": "HIGH",
    "recommendation": "USE_WITH_CONTEXT",
    "safety_note": "This is a general ImageNet-1K classifier, not a domain-specific safety, medical, or plant-disease model."
  }
}
```

## 9. POST /classify-image-annotated

API phan loai anh va tra ve anh PNG da ve nhan du doan top-1.

API nay khong tra JSON khi thanh cong. Response la file anh `image/png`.

### Request form-data

| Field | Kieu du lieu | Bat buoc | Mo ta |
|---|---:|---:|---|
| `file` | file image | Co | File anh can phan loai |
| `top_k` | query integer | Khong | So class dung khi goi model, tu `1` den `10`, mac dinh la `5` |

### Vi du curl

```bash
curl -X POST "http://localhost:8000/classify-image-annotated?top_k=5" \
  -F "file=@sample_images/classroom_object.jpg" \
  --output outputs/annotated.png
```

### Response

```text
Content-Type: image/png
Body: binary PNG image
```

## 10. GET /classify-image-demo

API tra ve giao dien web HTML de upload anh.

### Request

Khong co request body.

### Response

```text
Content-Type: text/html
Body: HTML page
```

## 11. Dinh dang loi JSON thuong gap

Khi request sai, FastAPI co the tra ve JSON loi.

### Vi du upload file khong phai anh

```json
{
  "detail": "Uploaded file must be an image."
}
```

### Vi du model anh chua load

```json
{
  "detail": {
    "model_loaded": false,
    "model_name": "squeezenet1.1_onnx_imagenet1k",
    "model_version": "vision_squeezenet_onnx_v2",
    "task": "image_classification",
    "num_classes": 1000,
    "input_size": "224x224",
    "runtime": "onnxruntime_cpu",
    "model_format": "ONNX",
    "model_path": "models/vision/squeezenet1.1-7.onnx",
    "labels_loaded": true,
    "status_message": "model file not found: models/vision/squeezenet1.1-7.onnx",
    "download_hint": "Run: python scripts/download_vision_model.py",
    "student_note": "The image model is not trained in Lab 5. Lab 5 teaches inference, API, UI, Docker, and model packaging."
  }
}
```
