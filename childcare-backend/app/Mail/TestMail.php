<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'ChildCare System - Test Email',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.test',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}