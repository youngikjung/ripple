ls
vi server2.js
mkdir router
cd router/
mkdir main2.js
ls
rm -rf main2.js/
vi main2.js
cd ..
vi config2.js
node server2.js 
forever start -l /Backup2/nodeServer2.log --minUptime 5000 --spinSleepTime 2000 -a server2.js 
cd
ls
forever list
ls
vi server2.js 
exit
cd
ls
forever list
kill -9 48820
kill -9 48826
forever start -l /Backup2/nodeServer2.log --minUptime 5000 --spinSleepTime 2000 -a server2.js 
ls
exit
cd
forever list
kill -9 56927
kill -9 56933
forever start -l /Backup2/nodeServer2.log --minUptime 5000 --spinSleepTime 2000 -a server2.js 
ls
forever list
kill -9 56981
forever list
ls
exit
ls
cd
ls
forever list
tail -f /Backup2/nodeServer2.log
ps -ef | grep server2.js
ps -ef | grep node2/server2.js
ps -ef | grep node2/server2.js
tail -f /Backup2/nodeServer2.log
forever list
exit
