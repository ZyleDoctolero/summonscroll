extends Control
## Login: email + password against Supabase GoTrue (GAME_PLAN.md v6 scene 2).
## The password is sent straight to Supabase over HTTPS and never stored.

var _email: LineEdit
var _password: LineEdit
var _status: Label
var _button: Button


func _ready() -> void:
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)

	var box := VBoxContainer.new()
	box.custom_minimum_size = Vector2(360, 0)
	box.add_theme_constant_override("separation", 12)
	center.add_child(box)

	var title := Label.new()
	title.text = "SUMMONSCROLL"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 32)
	box.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Sign in with your web-app account"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.modulate = Color(1, 1, 1, 0.7)
	box.add_child(subtitle)

	_email = LineEdit.new()
	_email.placeholder_text = "Email"
	_email.custom_minimum_size = Vector2(0, 44)
	box.add_child(_email)

	_password = LineEdit.new()
	_password.placeholder_text = "Password"
	_password.secret = true
	_password.custom_minimum_size = Vector2(0, 44)
	_password.text_submitted.connect(func(_t: String) -> void: _on_sign_in())
	box.add_child(_password)

	_button = Button.new()
	_button.text = "Sign In"
	_button.custom_minimum_size = Vector2(0, 48)
	_button.pressed.connect(_on_sign_in)
	box.add_child(_button)

	_status = Label.new()
	_status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	box.add_child(_status)


func _on_sign_in() -> void:
	var email := _email.text.strip_edges()
	var password := _password.text
	if email == "" or password == "":
		_status.text = "Enter your email and password."
		return
	_button.disabled = true
	_status.text = "Signing in…"
	var res: Dictionary = await Sb.sign_in(email, password)
	if res.get("ok", false):
		get_tree().change_scene_to_file("res://scenes/sanctum.tscn")
	else:
		_button.disabled = false
		_status.text = str(res.get("error", "Sign-in failed"))
