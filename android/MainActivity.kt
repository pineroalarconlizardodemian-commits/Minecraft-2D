package com.tuusuario.minecraft2d

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Mantener la pantalla encendida mientras se juega
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Modo inmersivo (pantalla completa, oculta barras de navegación)
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
        )

        webView = WebView(this)
        
        // Configuración del WebView para el juego
        webView.settings.apply {
            javaScriptEnabled = true       // Vital para que funcione tu motor JS
            domStorageEnabled = true       // Permite usar localStorage (para guardar partidas)
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false // Para sonidos
            builtInZoomControls = false    // Evita el zoom con los dedos
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        // Evita que el juego se abra en el navegador externo
        webView.webViewClient = WebViewClient()

        // Cargar el index.html desde la carpeta assets
        webView.loadUrl("file:///android_asset/www/index.html")

        setContentView(webView)
    }

    // Manejar el botón "Atrás" para que no cierre el juego de golpe
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
