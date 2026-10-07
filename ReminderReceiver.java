package com.pauseandpage.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && ReminderScheduler.ACTION.equals(intent.getAction())) {
            String kind = intent.getStringExtra("kind");
            ReminderScheduler.show(context, kind == null ? "morning" : kind);
        }
        ReminderScheduler.scheduleAll(context); // queue the next one
    }
}
