# AIoT Inference Dashboard

Web tinh dung cac endpoint duoc mo ta trong `API.md`.

## Chay web

Dam bao API backend dang chay o:

```text
http://127.0.0.1:8000
```

Sau do chay web server kem proxy:

```powershell
python web_server.py
```

Mo:

```text
http://127.0.0.1:5500/index.html
```

Web goi API qua proxy cung origin:

```text
http://127.0.0.1:5500/api
```

Khong mo truc tiep `index.html` bang `file://`, vi browser se gan origin la `null` va de bi chan CORS.
