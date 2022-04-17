from django import forms


class ChatCreateForm(forms.Form):
    message = forms.CharField()
