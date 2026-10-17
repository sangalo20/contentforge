#!/usr/bin/osascript
-- usage: osascript export_pdf.applescript /abs/in.pptx /abs/out.pdf
-- Opens the pptx in Keynote, waits for the import to finish, exports a PDF, closes.
on run argv
	set inPath to item 1 of argv
	set outPath to item 2 of argv
	set inFile to POSIX file inPath
	set outFile to POSIX file outPath
	with timeout of 600 seconds
		tell application id "com.apple.Keynote"
			activate
			set beforeCount to count of documents
			open inFile
			-- pptx import is asynchronous: poll until a new document appears
			repeat 120 times
				if (count of documents) > beforeCount then exit repeat
				delay 1
			end repeat
			set d to front document
			export d to outFile as PDF
			close d saving no
		end tell
	end timeout
	return "exported " & outPath
end run
