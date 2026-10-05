def system_status(database: str, redis_status: str = "not_configured") -> dict:
    return {
        "database": database,
        "redis": {"status": redis_status, "role": "Cache for the original calm pack shipped with the app."},
        "flower": {"status": "not_configured", "role": "Federated learning coordinator stub. No gradients leave this prototype."},
        "opacus": {"status": "not_configured", "role": "DP-SGD stub. There is no trained model to privatize yet."},
        "indicwav2vec": {"status": "not_configured", "role": "Speech stub. This prototype does not use the microphone."},
        "media_cdn": {"status": "disabled", "role": "No third-party video. The calm close is packaged in the app."},
        "camera": {"status": "disabled", "role": "No eye tracking in this prototype."},
    }
