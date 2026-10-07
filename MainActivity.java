package com.pauseandpage.app;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;

/**
 * Hosts the bundled, offline Pause and Page interface (assets/index.html) in a WebView.
 * tel:, sms: and mailto: links are handed to the system so the dialler/messaging app opens
 * with details filled in. Nothing is ever called, sent or shared automatically.
 */
public class MainActivity extends Activity {
    private static final int REQ_NOTIFICATIONS = 41;
    private WebView web;
    private String pendingTarget;
    private boolean pageReady;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applySecure(ReminderScheduler.prefs(this).getBoolean("secure", false));

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(true);

        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleLink(request.getUrl());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                pageReady = true;
                deliverTarget();
            }
        });
        web.addJavascriptInterface(new Bridge(), "Android");

        pendingTarget = targetFrom(getIntent());
        web.loadUrl("file:///android_asset/index.html");
        ReminderScheduler.scheduleAll(this);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        pendingTarget = targetFrom(intent);
        deliverTarget();
    }

    /** pauseandpage://urgent (launcher shortcut) or pauseandpage://affirmation?kind=morning (notification). */
    private static String targetFrom(Intent intent) {
        if (intent == null || intent.getData() == null) return null;
        Uri d = intent.getData();
        if (!"pauseandpage".equals(d.getScheme())) return null;
        String host = d.getHost() == null ? "" : d.getHost();
        String kind = d.getQueryParameter("kind");
        return kind == null ? host : host + ":" + kind;
    }

    private void deliverTarget() {
        if (!pageReady || pendingTarget == null || web == null) return;
        String js = "window.PP && PP.openFromNative(" + JSONObject.quote(pendingTarget) + ")";
        pendingTarget = null;
        web.evaluateJavascript(js, null);
    }

    private boolean handleLink(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        Intent intent;
        switch (scheme) {
            case "file":
                return false;
            case "tel":
                intent = new Intent(Intent.ACTION_DIAL, uri); // opens the dialler only; never places the call
                break;
            case "sms":
            case "smsto":
            case "mailto":
                intent = new Intent(Intent.ACTION_SENDTO, uri);
                break;
            case "http":
            case "https":
                intent = new Intent(Intent.ACTION_VIEW, uri);
                break;
            default:
                return true;
        }
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException e) {
            String detail = "tel".equals(scheme) ? " Number: " + uri.getSchemeSpecificPart() : "";
            Toast.makeText(this, "No app on this device can open this." + detail, Toast.LENGTH_LONG).show();
        }
        return true;
    }

    private void safeStart(Intent intent) {
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "No app on this device can do that.", Toast.LENGTH_LONG).show();
        }
    }

    private void applySecure(boolean on) {
        if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        if (web == null || !pageReady) {
            super.onBackPressed();
            return;
        }
        web.evaluateJavascript("window.PP ? PP.back() : 'exit'", value -> {
            if (value == null || value.contains("exit")) finish();
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_NOTIFICATIONS && web != null) {
            web.evaluateJavascript("window.PP && PP.refresh && PP.refresh()", null);
        }
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    /** Methods callable from the page as window.Android.*. Runs on a background thread. */
    private class Bridge {
        @JavascriptInterface
        public boolean isApp() {
            return true;
        }

        @JavascriptInterface
        public void scheduleReminders(String json) {
            ReminderScheduler.prefs(MainActivity.this).edit().putString("config", json).apply();
            ReminderScheduler.scheduleAll(MainActivity.this);
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            if (Build.VERSION.SDK_INT >= 33
                    && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(() -> requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, REQ_NOTIFICATIONS));
            }
        }

        @JavascriptInterface
        public String notificationStatus() {
            NotificationManager nm = getSystemService(NotificationManager.class);
            return (nm != null && nm.areNotificationsEnabled()) ? "on" : "off";
        }

        @JavascriptInterface
        public void openNotificationSettings() {
            Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            i.putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
            runOnUiThread(() -> safeStart(i));
        }

        @JavascriptInterface
        public void share(String title, String text) {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_SUBJECT, title);
            send.putExtra(Intent.EXTRA_TEXT, text);
            Intent chooser = Intent.createChooser(send, title);
            runOnUiThread(() -> safeStart(chooser));
        }

        @JavascriptInterface
        public void setSecure(boolean on) {
            ReminderScheduler.prefs(MainActivity.this).edit().putBoolean("secure", on).apply();
            runOnUiThread(() -> applySecure(on));
        }

        @JavascriptInterface
        public void clearNative() {
            ReminderScheduler.cancelAll(MainActivity.this);
            ReminderScheduler.prefs(MainActivity.this).edit().clear().apply();
            runOnUiThread(() -> applySecure(false));
        }
    }
}
