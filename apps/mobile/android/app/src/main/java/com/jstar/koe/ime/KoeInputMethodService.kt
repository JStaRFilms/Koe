package com.jstar.koe.ime

import android.content.Context
import android.inputmethodservice.InputMethodService
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.TextView
import com.jstar.koe.R

class KoeInputMethodService : InputMethodService() {
  private var statusView: TextView? = null
  private var micButton: Button? = null
  private var stopButton: Button? = null
  private var cancelButton: Button? = null
  private var switchButton: Button? = null
  private var isWorking = false

  override fun onCreateInputView(): View {
    val inputView = layoutInflater.inflate(R.layout.ime_voice_input_view, null)
    statusView = inputView.findViewById(R.id.ime_status)
    micButton = inputView.findViewById(R.id.ime_mic_button)
    stopButton = inputView.findViewById(R.id.ime_stop_button)
    cancelButton = inputView.findViewById(R.id.ime_cancel_button)
    switchButton = inputView.findViewById(R.id.ime_switch_button)

    micButton?.setOnClickListener { commitPrototypeText() }
    stopButton?.setOnClickListener { finishWorkingSession() }
    cancelButton?.setOnClickListener { cancelSession() }
    switchButton?.setOnClickListener { showKeyboardPicker() }

    resetSessionState()
    return inputView
  }

  override fun onStartInput(attribute: EditorInfo?, restarting: Boolean) {
    super.onStartInput(attribute, restarting)
    resetSessionState()
  }

  override fun onStartInputView(attribute: EditorInfo?, restarting: Boolean) {
    super.onStartInputView(attribute, restarting)
    resetSessionState()
  }

  override fun onFinishInput() {
    super.onFinishInput()
    resetSessionState()
  }

  private fun commitPrototypeText() {
    val editorInfo = currentInputEditorInfo
    val inputConnection = currentInputConnection

    if (editorInfo == null || inputConnection == null) {
      setStatus(R.string.ime_status_no_active_field)
      return
    }

    if (editorInfo.inputType == EditorInfo.TYPE_NULL) {
      setStatus(R.string.ime_status_no_commit_support)
      return
    }

    isWorking = true
    renderState()

    val committed = inputConnection.commitText(getString(R.string.ime_prototype_text), 1)
    if (committed) {
      setStatus(R.string.ime_status_working)
      return
    }

    isWorking = false
    renderState()
    setStatus(R.string.ime_status_commit_failed)
  }

  private fun finishWorkingSession() {
    if (!isWorking) {
      setStatus(R.string.ime_status_idle)
      return
    }

    currentInputConnection?.finishComposingText()
    isWorking = false
    renderState()
    setStatus(R.string.ime_status_idle)
  }

  private fun cancelSession() {
    currentInputConnection?.finishComposingText()
    isWorking = false
    renderState()
    setStatus(R.string.ime_status_idle)
    requestHideSelf(0)
  }

  private fun showKeyboardPicker() {
    val inputMethodManager = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
    if (inputMethodManager == null) {
      setStatus(R.string.ime_status_switch_unavailable)
      return
    }

    inputMethodManager.showInputMethodPicker()
    setStatus(R.string.ime_status_picker_opened)
  }

  private fun resetSessionState() {
    isWorking = false
    renderState()
    setStatus(R.string.ime_status_idle)
  }

  private fun renderState() {
    micButton?.isEnabled = !isWorking
    stopButton?.isEnabled = isWorking
    cancelButton?.isEnabled = true
    switchButton?.isEnabled = true
  }

  private fun setStatus(statusResId: Int) {
    statusView?.setText(statusResId)
  }
}
