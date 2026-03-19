package com.jstar.koe.ime

import android.inputmethodservice.InputMethodService
import android.view.Gravity
import android.view.View
import android.widget.TextView

class KoeInputMethodService : InputMethodService() {
  override fun onCreateInputView(): View {
    return TextView(this).apply {
      text = "Koe Voice"
      textSize = 18f
      gravity = Gravity.CENTER
      setPadding(48, 48, 48, 48)
    }
  }
}
