on run
  try
    set appPath to POSIX path of (path to me)
    set appFolder to do shell script "/usr/bin/dirname " & quoted form of appPath
    do shell script "/bin/bash " & quoted form of (appFolder & "/start-mac.sh")
  on error errorText
    display alert "Lectio kunne ikke åbnes" message errorText as critical
  end try
end run
